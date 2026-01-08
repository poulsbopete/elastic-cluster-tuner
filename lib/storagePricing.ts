// Storage pricing per TB/month based on cloud provider pricing
// These are separate from compute costs

export interface StoragePricing {
  hotSSD: number;      // $/TB/month for hot tier SSD
  coldHDD: number;     // $/TB/month for cold tier HDD
  coldSSD: number;     // $/TB/month for cold tier SSD
  frozenSSD: number;   // $/TB/month for frozen tier SSD (cache)
  frozenBlob: number; // $/TB/month for frozen tier blob storage (GCS/S3)
}

// GCP Storage Pricing
export const GCP_STORAGE_PRICING: StoragePricing = {
  hotSSD: 170,        // $109,000/mo for 640 TB = ~$170/TB/mo
  coldHDD: 40,        // $24,000/mo for 600 TB = ~$40/TB/mo
  coldSSD: 170,       // Similar to hot for SSD
  frozenSSD: 170,     // $112,000/mo for 660 TB = ~$170/TB/mo
  frozenBlob: 20,     // $300,000/mo for 15 PB = ~$20/TB/mo
};

// AWS Storage Pricing
export const AWS_STORAGE_PRICING: StoragePricing = {
  hotSSD: 180,
  coldHDD: 45,
  coldSSD: 180,
  frozenSSD: 180,
  frozenBlob: 25,     // S3 pricing
};

// Azure Storage Pricing
export const AZURE_STORAGE_PRICING: StoragePricing = {
  hotSSD: 175,
  coldHDD: 42,
  coldSSD: 175,
  frozenSSD: 175,
  frozenBlob: 22,     // Blob storage pricing
};

// Compute pricing per node (n2-standard-32 equivalent: 32 vCPU, 64GB RAM)
// Based on: $331,000/mo for 292 nodes = ~$1,134/node/month
export const COMPUTE_PRICING: Record<string, number> = {
  gcp: 1134,  // n2-standard-32 equivalent
  aws: 1200,  // Similar instance type
  azure: 1150, // Similar instance type
  elastic_cloud: 512, // Elastic Cloud pricing
  on_prem: 500,      // Estimated
  serverless: 0,      // Pay per use
};

export function getStoragePricing(deploymentType: string): StoragePricing {
  switch (deploymentType) {
    case 'gcp':
      return GCP_STORAGE_PRICING;
    case 'aws':
      return AWS_STORAGE_PRICING;
    case 'azure':
      return AZURE_STORAGE_PRICING;
    default:
      // Default to GCP pricing
      return GCP_STORAGE_PRICING;
  }
}

export function calculateStorageCost(
  storageGB: number,
  storageType: 'ssd' | 'hdd' | 'nvme',
  tierType: 'hot' | 'warm' | 'cold' | 'frozen' | 'deep_freeze',
  deploymentType: string,
  useBlobStorage: boolean = false // For frozen tier, can use blob storage
): number {
  const pricing = getStoragePricing(deploymentType);
  const storageTB = storageGB / 1024;

  if (tierType === 'frozen' || tierType === 'deep_freeze') {
    // Frozen tier can use blob storage (cheaper) or SSD cache
    if (useBlobStorage) {
      return storageTB * pricing.frozenBlob;
    }
    return storageTB * pricing.frozenSSD;
  }

  if (tierType === 'cold') {
    if (storageType === 'hdd') {
      return storageTB * pricing.coldHDD;
    }
    return storageTB * pricing.coldSSD;
  }

  // Hot and warm tiers use SSD
  return storageTB * pricing.hotSSD;
}
