// PB-scale sizing recommendations for petabyte-scale workloads
// Optimized for high-volume ingest and search at scale

export interface PBScaleRecommendation {
  hot: {
    nodes: number;
    ramGB: number;
    vCPU: number;
    storageTB: number;
    retentionHours: number;
  };
  cold: {
    nodes: number;
    ramGB: number;
    vCPU: number;
    storageTB: number;
    retentionHours: number;
  };
  frozen: {
    nodes: number;
    ramGB: number;
    vCPU: number;
    storageTB: number;
  };
  infrastructure: {
    masterNodes: number;
    mlNodes: number;
    kibanaNodes: number;
  };
  storage: {
    compressionRatio: number; // e.g., 0.53 means 53% reduction (47% of original size)
    frozen30DayPB: number; // Frozen tier storage for 30 days
    deepFreezeYearlyPB: number; // Deep freeze storage per year
  };
}

// PB-scale recommendation (for ~0.5 PB/day ingest)
export const ELASTIC_PB_SCALE_RECOMMENDATION: PBScaleRecommendation = {
  hot: {
    nodes: 160,
    ramGB: 64,
    vCPU: 32,
    storageTB: 4,
    retentionHours: 0, // Immediate move to cold
  },
  cold: {
    nodes: 60,
    ramGB: 64,
    vCPU: 32,
    storageTB: 10,
    retentionHours: 24, // 24-hour lookback
  },
  frozen: {
    nodes: 66,
    ramGB: 64,
    vCPU: 32,
    storageTB: 10,
  },
  infrastructure: {
    masterNodes: 3,
    mlNodes: 1,
    kibanaNodes: 2,
  },
  storage: {
    compressionRatio: 0.53, // 53% reduction = 47% of original size
    frozen30DayPB: 15, // 15 PB for rolling 30-day frozen tier
    deepFreezeYearlyPB: 100, // 100+ PB per year for deep-freeze
  },
};

// Calculate storage requirements based on ingest volume and retention
export function calculateStorageRequirements(
  dailyIngestPB: number,
  retentionDays: number,
  compressionRatio: number = 0.53
): number {
  // After compression: 1 - compressionRatio = actual storage needed
  // e.g., 53% reduction means we need 47% of original size
  const compressionFactor = 1 - compressionRatio;
  return dailyIngestPB * retentionDays * compressionFactor;
}

// Calculate if configuration matches PB-scale recommendations
export function compareToPBScale(
  hotNodes: number,
  hotStorageTB: number,
  coldNodes: number,
  coldStorageTB: number,
  frozenNodes: number,
  frozenStorageTB: number
): {
  matches: boolean;
  differences: string[];
} {
  const rec = ELASTIC_PB_SCALE_RECOMMENDATION;
  const differences: string[] = [];

  if (hotNodes < rec.hot.nodes * 0.8) {
    differences.push(`Hot tier: ${hotNodes} nodes (recommended: ${rec.hot.nodes})`);
  }
  if (hotStorageTB < rec.hot.storageTB * 0.8) {
    differences.push(`Hot tier storage: ${hotStorageTB} TB/node (recommended: ${rec.hot.storageTB} TB/node)`);
  }
  if (coldNodes < rec.cold.nodes * 0.8) {
    differences.push(`Cold tier: ${coldNodes} nodes (recommended: ${rec.cold.nodes})`);
  }
  if (coldStorageTB < rec.cold.storageTB * 0.8) {
    differences.push(`Cold tier storage: ${coldStorageTB} TB/node (recommended: ${rec.cold.storageTB} TB/node)`);
  }
  if (frozenNodes < rec.frozen.nodes * 0.8) {
    differences.push(`Frozen tier: ${frozenNodes} nodes (recommended: ${rec.frozen.nodes})`);
  }

  return {
    matches: differences.length === 0,
    differences,
  };
}
