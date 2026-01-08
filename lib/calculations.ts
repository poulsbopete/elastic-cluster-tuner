import { ClusterConfig, PerformanceMetrics, TierConfig, TierType, HardwareProfile } from '@/types';

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

// Base performance per node (assuming optimal hot tier SSD configuration)
const BASE_INGEST_PER_NODE = 50000; // documents per second
const BASE_QUERY_LATENCY = 50; // milliseconds for hot tier SSD

function calculateTierIngestCapacity(tier: TierConfig): number {
  if (!tier.enabled) return 0;

  const multiplier = TIER_PERFORMANCE_MULTIPLIERS[tier.type];
  const storageMultiplier = tier.storageType === 'nvme' ? 1.2 : tier.storageType === 'ssd' ? 1.0 : 0.3;
  const cpuMultiplier = Math.min(tier.cpuCores / 8, 2); // Cap at 2x for very high CPU
  const memoryMultiplier = Math.min(tier.memoryGB / 32, 1.5); // Cap at 1.5x for very high memory

  const baseCapacity = BASE_INGEST_PER_NODE * tier.nodeCount;
  return baseCapacity * multiplier.ingest * storageMultiplier * cpuMultiplier * memoryMultiplier;
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
  
  // Calculate total ingest capacity (weighted by tier)
  const totalIngestCapacity = enabledTiers.reduce((sum, tier) => {
    return sum + calculateTierIngestCapacity(tier);
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

  // Calculate storage efficiency (SSD is more efficient for active data)
  const totalStorage = enabledTiers.reduce((sum, tier) => {
    return sum + (tier.storageSizeGB * tier.nodeCount);
  }, 0);

  const efficientStorage = enabledTiers.reduce((sum, tier) => {
    const efficiency = tier.storageType === 'nvme' ? 1.0 : tier.storageType === 'ssd' ? 0.9 : 0.6;
    return sum + (tier.storageSizeGB * tier.nodeCount * efficiency);
  }, 0);

  const storageEfficiency = totalStorage > 0 ? (efficientStorage / totalStorage) * 100 : 0;

  // Calculate cost estimate
  const monthlyCost = enabledTiers.reduce((sum, tier) => {
    // Find matching hardware profile or estimate
    const profile = Object.values(HARDWARE_PROFILES).find(p =>
      p.storageType === tier.storageType &&
      Math.abs(p.storageSizeGB - tier.storageSizeGB) < 500 &&
      Math.abs(p.cpuCores - tier.cpuCores) <= 4 &&
      Math.abs(p.memoryGB - tier.memoryGB) <= 16
    );

    const nodeCost = profile ? profile.costPerMonth : 
      (tier.storageType === 'nvme' ? 1200 : tier.storageType === 'ssd' ? 300 : 150);
    
    return sum + (nodeCost * tier.nodeCount);
  }, 0);

  // Tier breakdown
  const tierBreakdown = enabledTiers.map(tier => ({
    tier: tier.type,
    ingestCapacity: calculateTierIngestCapacity(tier),
    queryPerformance: calculateTierQueryLatency(tier),
    storageUsed: tier.storageSizeGB * tier.nodeCount,
  }));

  return {
    maxIngestRate: totalIngestCapacity,
    avgQueryLatency: Math.round(avgQueryLatency * 10) / 10,
    avgIngestLatency: Math.round(avgIngestLatency * 10) / 10,
    storageEfficiency: Math.round(storageEfficiency * 10) / 10,
    costEstimate: Math.round(monthlyCost),
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
