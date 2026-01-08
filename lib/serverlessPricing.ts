// Elastic Serverless Observability Pricing
// Based on: https://www.elastic.co/pricing/serverless-observability

export type ServerlessTier = 'logs_essentials' | 'complete';

export interface ServerlessPricing {
  ingestPerGB: number;        // $ per GB ingested
  retentionPerGBPerMonth: number; // $ per GB retained per month
  egressPerGB: number;        // $ per GB transferred (after 50 GB free)
  egressFreeGB: number;       // Free egress per month
}

export const SERVERLESS_PRICING: Record<ServerlessTier, ServerlessPricing> = {
  logs_essentials: {
    ingestPerGB: 0.07,        // As low as $0.07 per GB ingested
    retentionPerGBPerMonth: 0.017, // As low as $0.017 per GB retained per month
    egressPerGB: 0.05,        // $0.05 per GB after 50 GB free
    egressFreeGB: 50,
  },
  complete: {
    ingestPerGB: 0.09,        // As low as $0.09 per GB ingested
    retentionPerGBPerMonth: 0.019, // As low as $0.019 per GB retained per month
    egressPerGB: 0.05,        // $0.05 per GB after 50 GB free
    egressFreeGB: 50,
  },
};

export interface ServerlessCostInput {
  ingestGB: number;           // GB ingested per month
  retentionGB: number;        // GB retained (average over month)
  egressGB: number;           // GB transferred per month
  tier: ServerlessTier;
}

export function calculateServerlessCost(input: ServerlessCostInput): {
  ingestCost: number;
  retentionCost: number;
  egressCost: number;
  totalCost: number;
} {
  const pricing = SERVERLESS_PRICING[input.tier];

  const ingestCost = input.ingestGB * pricing.ingestPerGB;
  const retentionCost = input.retentionGB * pricing.retentionPerGBPerMonth;
  
  // Egress: first 50 GB free, then $0.05 per GB
  const chargeableEgress = Math.max(0, input.egressGB - pricing.egressFreeGB);
  const egressCost = chargeableEgress * pricing.egressPerGB;

  const totalCost = ingestCost + retentionCost + egressCost;

  return {
    ingestCost: Math.round(ingestCost * 100) / 100,
    retentionCost: Math.round(retentionCost * 100) / 100,
    egressCost: Math.round(egressCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

// Convert ingest volume to GB for serverless pricing
export function convertVolumeToGB(
  value: number,
  volumeUnit: 'PB' | 'TB' | 'GB' | 'MB',
  timeUnit: 'day' | 'hour' | 'minute'
): number {
  // Convert to GB
  let gb = value;
  if (volumeUnit === 'PB') gb = value * 1024 * 1024;
  else if (volumeUnit === 'TB') gb = value * 1024;
  else if (volumeUnit === 'MB') gb = value / 1024;

  // Convert to monthly
  if (timeUnit === 'day') gb = gb * 30;
  else if (timeUnit === 'hour') gb = gb * 30 * 24;
  else if (timeUnit === 'minute') gb = gb * 30 * 24 * 60;

  return gb;
}
