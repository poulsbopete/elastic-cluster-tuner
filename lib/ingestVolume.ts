// Utility functions for converting ingest volume to documents per second

export type VolumeUnit = 'PB' | 'TB' | 'GB' | 'MB';
export type TimeUnit = 'day' | 'hour' | 'minute';

export interface IngestVolume {
  value: number;
  volumeUnit: VolumeUnit;
  timeUnit: TimeUnit;
  avgDocumentSizeKB?: number; // Average document size in KB (for converting volume to docs/s)
}

// Convert volume to bytes
export function volumeToBytes(value: number, unit: VolumeUnit): number {
  const multipliers: Record<VolumeUnit, number> = {
    PB: 1024 ** 5,
    TB: 1024 ** 4,
    GB: 1024 ** 3,
    MB: 1024 ** 2,
  };
  return value * multipliers[unit];
}

// Convert time unit to seconds
export function timeToSeconds(value: number, unit: TimeUnit): number {
  const multipliers: Record<TimeUnit, number> = {
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  return value * multipliers[unit];
}

// Convert ingest volume to documents per second
// If avgDocumentSizeKB is not provided, uses default estimates based on data type
// Note: traces, logs, and metrics assume OpenTelemetry (OTLP) format
export function volumeToDocsPerSecond(
  volume: IngestVolume,
  dataType: 'traces' | 'logs' | 'metrics' | 'custom' = 'custom'
): number {
  // Default average document sizes (in KB) by data type
  // All assume OpenTelemetry (OTLP) format unless 'custom' is specified
  const defaultDocSizes: Record<string, number> = {
    traces: 2.5, // Average OTLP trace document ~2.5KB
    logs: 1.0,   // Average OTLP log document ~1KB
    metrics: 0.1, // Average OTLP metric document ~0.1KB
    custom: 1.0, // Default assumption (user must specify avgDocumentSizeKB for custom)
  };

  const avgDocSizeKB = volume.avgDocumentSizeKB || defaultDocSizes[dataType] || defaultDocSizes['custom'];
  const avgDocSizeBytes = avgDocSizeKB * 1024;

  // Convert volume to bytes per second
  const bytesPerSecond = volumeToBytes(volume.value, volume.volumeUnit) / timeToSeconds(1, volume.timeUnit);

  // Convert to documents per second
  return bytesPerSecond / avgDocSizeBytes;
}

// Format volume for display
export function formatVolume(volume: IngestVolume): string {
  return `${volume.value} ${volume.volumeUnit}/${volume.timeUnit}`;
}

// Format documents per second
export function formatDocsPerSecond(docsPerSecond: number): string {
  if (docsPerSecond >= 1000000) return `${(docsPerSecond / 1000000).toFixed(2)}M docs/s`;
  if (docsPerSecond >= 1000) return `${(docsPerSecond / 1000).toFixed(2)}K docs/s`;
  return `${docsPerSecond.toFixed(0)} docs/s`;
}
