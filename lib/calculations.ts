import { ClusterConfig, PerformanceMetrics, TierConfig, TierType, HardwareProfile } from '@/types';
import { getSKUById } from './skus';
import { volumeToDocsPerSecond } from './ingestVolume';
import { calculateStorageRequirements, compareToPBScale } from './pbScaleRecommendations';
import { calculateStorageCost, COMPUTE_PRICING } from './storagePricing';

// Hardware profiles with realistic specifications
export const HARDWARE_PROFILES: Record<string, HardwareProfile> = {
  'ssd-small': {
    name: 'SSD Small',
    storageType: 'ssd',
    storageSizeGB: 500,
    cpuCores: 4,
    memoryGB: 16,
    iops: 3000,
    throughputMBps: 500,
    costPerMonth: 150,
  },
  'ssd-medium': {
    name: 'SSD Medium',
    storageType: 'ssd',
    storageSizeGB: 2000,
    cpuCores: 8,
    memoryGB: 32,
    iops: 10000,
    throughputMBps: 1000,
    costPerMonth: 400,
  },
  'ssd-large': {
    name: 'SSD Large',
    storageType: 'ssd',
    storageSizeGB: 5000,
    cpuCores: 16,
    memoryGB: 64,
    iops: 20000,
    throughputMBps: 2000,
    costPerMonth: 1000,
  },
  'hdd-small': {
    name: 'HDD Small',
    storageType: 'hdd',
    storageSizeGB: 2000,
    cpuCores: 4,
    memoryGB: 16,
    iops: 150,
    throughputMBps: 150,
    costPerMonth: 80,
  },
  'hdd-medium': {
    name: 'HDD Medium',
    storageType: 'hdd',
    storageSizeGB: 5000,
    cpuCores: 8,
    memoryGB: 32,
    iops: 300,
    throughputMBps: 200,
    costPerMonth: 200,
  },
  'hdd-large': {
    name: 'HDD Large',
    storageType: 'hdd',
    storageSizeGB: 10000,
    cpuCores: 16,
    memoryGB: 64,
    iops: 500,
    throughputMBps: 300,
    costPerMonth: 400,
  },
  'nvme-premium': {
    name: 'NVMe Premium',
    storageType: 'nvme',
    storageSizeGB: 2000,
    cpuCores: 16,
    memoryGB: 64,
    iops: 50000,
    throughputMBps: 3000,
    costPerMonth: 1500,
  },
};

// Tier performance multipliers (relative to hot tier)
const TIER_PERFORMANCE_MULTIPLIERS: Record<TierType, { ingest: number; query: number }> = {
  hot: { ingest: 1.0, query: 1.0 },
  warm: { ingest: 0.8, query: 0.7 },
  cold: { ingest: 0.3, query: 0.4 },
  frozen: { ingest: 0.1, query: 0.2 },
  deep_freeze: { ingest: 0.05, query: 0.1 },
};

// Base performance per node (optimized for PB-scale workloads)
// For 64GB RAM, 32 vCPU, 4TB SSD nodes (PB-scale recommendation)
// Default: 2000 ops/core (recommended baseline), typical range: 2000-2500 ops/core
const DEFAULT_OPS_PER_CORE = 2000; // operations per CPU core per second
const BASE_QUERY_LATENCY = 50; // milliseconds for hot tier SSD

function calculateTierIngestCapacity(tier: TierConfig, opsPerCore: number = DEFAULT_OPS_PER_CORE): number {
  if (!tier.enabled) return 0;

  const multiplier = TIER_PERFORMANCE_MULTIPLIERS[tier.type];
  const storageMultiplier = tier.storageType === 'nvme' ? 1.2 : tier.storageType === 'ssd' ? 1.0 : 0.3;
  
  // Calculate base capacity: ops/core * CPU cores * node count
  // This is the core calculation for performance estimation
  const baseOpsPerNode = opsPerCore * tier.cpuCores;
  const baseCapacity = baseOpsPerNode * tier.nodeCount;
  
  // Apply tier and storage multipliers
  // Note: CPU scaling is already handled by ops/core * cpuCores, so we don't need cpuMultiplier
  // Memory multiplier: 64GB = 1.0x (PB-scale baseline), scales proportionally down for smaller configs
  const memoryMultiplier = Math.min(tier.memoryGB / 64, 1.0); // Don't exceed baseline

  return baseCapacity * multiplier.ingest * storageMultiplier * memoryMultiplier;
}

function calculateTierQueryLatency(tier: TierConfig): number {
  if (!tier.enabled) return Infinity;

  const multiplier = TIER_PERFORMANCE_MULTIPLIERS[tier.type];
  const storageMultiplier = tier.storageType === 'nvme' ? 0.8 : tier.storageType === 'ssd' ? 1.0 : 2.5;
  const cpuMultiplier = Math.max(8 / tier.cpuCores, 0.5); // More CPU = lower latency
  const memoryMultiplier = Math.max(32 / tier.memoryGB, 0.7); // More memory = lower latency

  return BASE_QUERY_LATENCY * multiplier.query * storageMultiplier * cpuMultiplier * memoryMultiplier;
}

function calculateTierIngestLatency(tier: TierConfig): number {
  if (!tier.enabled) return Infinity;

  const multiplier = TIER_PERFORMANCE_MULTIPLIERS[tier.type];
  const storageMultiplier = tier.storageType === 'nvme' ? 0.7 : tier.storageType === 'ssd' ? 1.0 : 3.0;
  const iopsMultiplier = Math.max(10000 / tier.iops, 0.5);

  return 10 * multiplier.ingest * storageMultiplier * iopsMultiplier; // Base 10ms for hot tier
}

export function calculatePerformanceMetrics(config: ClusterConfig): PerformanceMetrics {
  const enabledTiers = config.tiers.filter(t => t.enabled);
  const opsPerCore = config.opsPerCore || DEFAULT_OPS_PER_CORE;
  
  // Calculate total ingest capacity (weighted by tier)
  const totalIngestCapacity = enabledTiers.reduce((sum, tier) => {
    return sum + calculateTierIngestCapacity(tier, opsPerCore);
  }, 0);

  // Calculate weighted average query latency
  const queryLatencies = enabledTiers.map(tier => ({
    tier,
    latency: calculateTierQueryLatency(tier),
    weight: tier.nodeCount,
  }));

  const totalWeight = queryLatencies.reduce((sum, q) => sum + q.weight, 0);
  const avgQueryLatency = totalWeight > 0
    ? queryLatencies.reduce((sum, q) => sum + (q.latency * q.weight), 0) / totalWeight
    : 0;

  // Calculate weighted average ingest latency
  const ingestLatencies = enabledTiers.map(tier => ({
    tier,
    latency: calculateTierIngestLatency(tier),
    weight: tier.nodeCount,
  }));

  const avgIngestLatency = totalWeight > 0
    ? ingestLatencies.reduce((sum, i) => sum + (i.latency * i.weight), 0) / totalWeight
    : 0;

  // Calculate total storage (raw capacity)
  const totalStorage = enabledTiers.reduce((sum, tier) => {
    return sum + (tier.storageSizeGB * tier.nodeCount);
  }, 0);

  // Calculate storage efficiency (SSD is more efficient for active data)
  const efficientStorage = enabledTiers.reduce((sum, tier) => {
    const efficiency = tier.storageType === 'nvme' ? 1.0 : tier.storageType === 'ssd' ? 0.9 : 0.6;
    return sum + (tier.storageSizeGB * tier.nodeCount * efficiency);
  }, 0);

  const storageEfficiency = totalStorage > 0 ? (efficientStorage / totalStorage) * 100 : 0;

  // Calculate compressed storage for cold/frozen tiers (53% reduction = 47% of original)
  const compressionRatio = 0.53; // Typical compression ratio for Elasticsearch data
  const compressedStorage = enabledTiers.reduce((sum, tier) => {
    if (tier.type === 'cold' || tier.type === 'frozen' || tier.type === 'deep_freeze') {
      // Apply compression to cold/frozen tiers
      return sum + (tier.storageSizeGB * tier.nodeCount * (1 - compressionRatio));
    }
    return sum + (tier.storageSizeGB * tier.nodeCount);
  }, 0);

  // Calculate compute cost (separate from storage)
  const computeCost = enabledTiers.reduce((sum, tier) => {
    // If SKU is selected, check if it's a PB-scale tested SKU (compute only)
    if (tier.skuId) {
      const sku = getSKUById(tier.skuId);
      if (sku && sku.id.includes('pb-')) {
        // For PB-scale SKUs, use compute pricing (storage is separate)
        const computePrice = COMPUTE_PRICING[config.deploymentType] || 1134;
        return sum + (computePrice * tier.nodeCount);
      }
      // For regular SKUs, use SKU pricing (may include storage, but we'll separate it)
      const skuComputePrice = COMPUTE_PRICING[config.deploymentType] || 1134;
      return sum + (skuComputePrice * tier.nodeCount);
    }

    // Estimate compute cost based on deployment type
    const computePrice = COMPUTE_PRICING[config.deploymentType] || 1134;
    return sum + (computePrice * tier.nodeCount);
  }, 0);

  // Calculate storage cost (separate from compute)
  let storageCost = 0;
  let frozenBlobStorageCost = 0;

  enabledTiers.forEach(tier => {
    if (!tier.enabled) return;
    
    const tierStorageGB = tier.storageSizeGB * tier.nodeCount;
    
    // For frozen tier, calculate both cache and blob storage
    if (tier.type === 'frozen' || tier.type === 'deep_freeze') {
      // Frozen tier uses both SSD cache (for searchable snapshots) and blob storage
      // Cache storage (SSD on nodes)
      storageCost += calculateStorageCost(
        tierStorageGB,
        'ssd', // Cache is always SSD
        tier.type,
        config.deploymentType,
        false // Cache is not blob
      );

      // Blob storage (GCS/S3) - calculate based on expected ingest volume if available
      if (config.expectedIngestVolume && config.expectedIngestVolume.value > 0) {
        // Calculate blob storage needed for 30-day retention with compression
        const dailyIngestPB = config.expectedIngestVolume.volumeUnit === 'PB' && 
                              config.expectedIngestVolume.timeUnit === 'day'
          ? config.expectedIngestVolume.value
          : 0;
        
        if (dailyIngestPB > 0) {
          // Example: 0.5 PB/day = 15 PB for 30 days (with 53% compression)
          const compressionRatio = 0.53;
          const blobStoragePB = dailyIngestPB * 30 * (1 - compressionRatio);
          const blobStorageGB = blobStoragePB * 1024;
          
          // Use blob storage pricing (much cheaper)
          frozenBlobStorageCost += calculateStorageCost(
            blobStorageGB,
            'hdd',
            tier.type,
            config.deploymentType,
            true // Use blob storage
          );
        }
      }
    } else {
      // Hot, warm, and cold tiers
      storageCost += calculateStorageCost(
        tierStorageGB,
        tier.storageType,
        tier.type,
        config.deploymentType
      );
    }
  });

  const totalStorageCost = storageCost + frozenBlobStorageCost;

  // Tier breakdown
  const tierBreakdown = enabledTiers.map(tier => ({
    tier: tier.type,
    ingestCapacity: calculateTierIngestCapacity(tier, opsPerCore),
    queryPerformance: calculateTierQueryLatency(tier),
    storageUsed: tier.storageSizeGB * tier.nodeCount,
  }));

  // Calculate expected ingest rate if volume is specified
  let expectedIngestRate: number | undefined;
  let capacityUtilization: number | undefined;
  const recommendations: string[] = [];
  
  if (config.expectedIngestVolume && config.expectedIngestVolume.value > 0) {
    expectedIngestRate = volumeToDocsPerSecond(
      config.expectedIngestVolume,
      config.expectedIngestVolume.dataType
    );
    capacityUtilization = totalIngestCapacity > 0
      ? (expectedIngestRate / totalIngestCapacity) * 100
      : undefined;

    // Check if this is PB-scale and compare to recommendations
    const dailyIngestPB = config.expectedIngestVolume.volumeUnit === 'PB' && 
                          config.expectedIngestVolume.timeUnit === 'day'
      ? config.expectedIngestVolume.value
      : 0;

    if (dailyIngestPB >= 0.3) { // PB-scale (0.3 PB/day or more)
      const hotTier = enabledTiers.find(t => t.type === 'hot' && t.enabled);
      const coldTier = enabledTiers.find(t => t.type === 'cold' && t.enabled);
      const frozenTier = enabledTiers.find(t => t.type === 'frozen' && t.enabled);

      if (hotTier && coldTier) {
        const hotStorageTB = hotTier.storageSizeGB / 1024;
        const coldStorageTB = coldTier.storageSizeGB / 1024;
        const frozenStorageTB = frozenTier ? frozenTier.storageSizeGB / 1024 : 0;

        const comparison = compareToPBScale(
          hotTier.nodeCount,
          hotStorageTB,
          coldTier.nodeCount,
          coldStorageTB,
          frozenTier?.nodeCount || 0,
          frozenStorageTB
        );

        if (!comparison.matches && comparison.differences.length > 0) {
          recommendations.push('PB-scale recommendation: Consider matching the recommended PB-scale configuration for optimal performance.');
          comparison.differences.forEach(diff => {
            recommendations.push(`  • ${diff}`);
          });
        }

        // Storage recommendations
        if (dailyIngestPB >= 0.5) {
          const required30DayStorage = calculateStorageRequirements(dailyIngestPB, 30, compressionRatio);
          recommendations.push(`For ${dailyIngestPB} PB/day with 30-day retention: ~${required30DayStorage.toFixed(1)} PB compressed storage needed.`);
          recommendations.push('Consider multiple clusters for PB-scale volumes with long retention periods.');
        }
      }
    }
  }

  // Add infrastructure node costs if specified (compute only, minimal storage)
  let infrastructureCost = 0;
  if (config.infrastructureNodes) {
    const infra = config.infrastructureNodes;
    // Infrastructure nodes use compute pricing (32 vCPU, 64GB RAM)
    const infraComputePrice = COMPUTE_PRICING[config.deploymentType] || 1134;
    const totalInfraNodes = infra.masterNodes + infra.coordinatingNodes + infra.mlNodes + infra.kibanaNodes;
    infrastructureCost = totalInfraNodes * infraComputePrice;
  }

  const totalMonthlyCost = computeCost + totalStorageCost + infrastructureCost;

  return {
    maxIngestRate: totalIngestCapacity,
    avgQueryLatency: Math.round(avgQueryLatency * 10) / 10,
    avgIngestLatency: Math.round(avgIngestLatency * 10) / 10,
    storageEfficiency: Math.round(storageEfficiency * 10) / 10,
    costEstimate: Math.round(totalMonthlyCost),
    computeCost: Math.round(computeCost + infrastructureCost),
    storageCost: Math.round(totalStorageCost),
    expectedIngestRate: expectedIngestRate ? Math.round(expectedIngestRate) : undefined,
    capacityUtilization: capacityUtilization ? Math.round(capacityUtilization * 10) / 10 : undefined,
    totalStorageGB: totalStorage,
    compressedStorageGB: compressedStorage > 0 ? Math.round(compressedStorage) : undefined,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
    opsPerCore: opsPerCore, // Include in metrics for display
    tierBreakdown,
  };
}

export function getDefaultTierConfig(type: TierType): TierConfig {
  const defaults: Record<TierType, Partial<TierConfig>> = {
    hot: {
      storageType: 'ssd',
      storageSizeGB: 2000,
      cpuCores: 8,
      memoryGB: 32,
      iops: 10000,
      throughputMBps: 1000,
      nodeCount: 3,
    },
    warm: {
      storageType: 'ssd',
      storageSizeGB: 5000,
      cpuCores: 8,
      memoryGB: 32,
      iops: 5000,
      throughputMBps: 500,
      nodeCount: 2,
    },
    cold: {
      storageType: 'hdd',
      storageSizeGB: 10000,
      cpuCores: 4,
      memoryGB: 16,
      iops: 300,
      throughputMBps: 200,
      nodeCount: 2,
    },
    frozen: {
      storageType: 'hdd',
      storageSizeGB: 20000,
      cpuCores: 2,
      memoryGB: 8,
      iops: 150,
      throughputMBps: 100,
      nodeCount: 1,
    },
    deep_freeze: {
      storageType: 'hdd',
      storageSizeGB: 50000,
      cpuCores: 2,
      memoryGB: 8,
      iops: 100,
      throughputMBps: 50,
      nodeCount: 1,
    },
  };

  return {
    type,
    enabled: type === 'hot', // Only hot enabled by default
    retentionHours: type === 'hot' ? 24 : type === 'warm' ? 168 : type === 'cold' ? 720 : 8760,
    ...defaults[type],
  } as TierConfig;
}
