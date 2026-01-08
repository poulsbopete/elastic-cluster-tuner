export type TierType = 'hot' | 'warm' | 'cold' | 'frozen' | 'deep_freeze';

export type StorageType = 'ssd' | 'hdd' | 'nvme';

export type DeploymentType = 'on_prem' | 'aws' | 'gcp' | 'azure' | 'elastic_cloud' | 'serverless';

export interface TierConfig {
  type: TierType;
  enabled: boolean;
  retentionHours: number;
  nodeCount: number;
  storageType: StorageType;
  storageSizeGB: number;
  cpuCores: number;
  memoryGB: number;
  iops: number; // Input/Output Operations Per Second
  throughputMBps: number; // Throughput in MB/s
}

export interface ClusterConfig {
  deploymentType: DeploymentType;
  tiers: TierConfig[];
  totalNodes: number;
}

export interface PerformanceMetrics {
  maxIngestRate: number; // documents per second
  avgQueryLatency: number; // milliseconds
  avgIngestLatency: number; // milliseconds
  storageEfficiency: number; // percentage
  costEstimate: number; // monthly cost estimate
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
