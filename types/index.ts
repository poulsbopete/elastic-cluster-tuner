export type TierType = 'hot' | 'warm' | 'cold' | 'frozen' | 'deep_freeze';

export type StorageType = 'ssd' | 'hdd' | 'nvme';

export type DeploymentType = 'on_prem' | 'aws' | 'gcp' | 'azure' | 'elastic_cloud' | 'serverless';

export interface HardwareSKU {
  id: string;
  name: string;
  description?: string;
  storageType: StorageType;
  storageSizeGB: number;
  cpuCores: number;
  memoryGB: number;
  iops: number;
  throughputMBps: number;
  costPerMonth: number;
  deploymentTypes: DeploymentType[]; // Which deployment types support this SKU
}

export interface TierConfig {
  type: TierType;
  enabled: boolean;
  retentionHours: number;
  nodeCount: number;
  skuId?: string; // Selected SKU ID
  storageType: StorageType;
  storageSizeGB: number;
  cpuCores: number;
  memoryGB: number;
  iops: number; // Input/Output Operations Per Second
  throughputMBps: number; // Throughput in MB/s
}

export interface IngestVolumeConfig {
  value: number;
  volumeUnit: 'PB' | 'TB' | 'GB' | 'MB';
  timeUnit: 'day' | 'hour' | 'minute';
  dataType: 'traces' | 'logs' | 'metrics' | 'custom'; // traces, logs, metrics assume OTLP format
  avgDocumentSizeKB?: number; // Required for 'custom', optional for OTLP types (uses defaults)
}

export interface InfrastructureNodes {
  masterNodes: number;
  coordinatingNodes: number;
  mlNodes: number;
  kibanaNodes: number;
}

export interface ClusterConfig {
  deploymentType: DeploymentType;
  tiers: TierConfig[];
  totalNodes: number;
  expectedIngestVolume?: IngestVolumeConfig;
  infrastructureNodes?: InfrastructureNodes;
  opsPerCore?: number; // Operations per CPU core per second (default: 2000, range: 2000-2500)
}

export interface PerformanceMetrics {
  maxIngestRate: number; // documents per second
  avgQueryLatency: number; // milliseconds
  avgIngestLatency: number; // milliseconds
  storageEfficiency: number; // percentage
  costEstimate: number; // monthly cost estimate (total)
  computeCost?: number; // Compute cost separate
  storageCost?: number; // Storage cost separate
  expectedIngestRate?: number; // Expected documents per second (if volume specified)
  capacityUtilization?: number; // Percentage of max capacity used
  totalStorageGB: number; // Total storage across all tiers
  compressedStorageGB?: number; // Storage after compression (for cold/frozen tiers)
  recommendations?: string[]; // Recommendations based on configuration
  opsPerCore?: number; // Operations per CPU core used in calculations
  tierBreakdown: {
    tier: TierType;
    ingestCapacity: number;
    queryPerformance: number;
    storageUsed: number;
  }[];
}

export interface HardwareProfile {
  name: string;
  storageType: StorageType;
  storageSizeGB: number;
  cpuCores: number;
  memoryGB: number;
  iops: number;
  throughputMBps: number;
  costPerMonth: number;
}
