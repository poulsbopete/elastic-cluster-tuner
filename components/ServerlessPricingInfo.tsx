'use client';

import React from 'react';
import { IngestVolumeConfig } from '@/types';
import { calculateServerlessCost, convertVolumeToGB, ServerlessTier, SERVERLESS_PRICING } from '@/lib/serverlessPricing';

interface ServerlessPricingInfoProps {
  expectedIngestVolume?: IngestVolumeConfig;
  tier: ServerlessTier;
}

export default function ServerlessPricingInfo({ expectedIngestVolume, tier }: ServerlessPricingInfoProps) {
  const tierPricing = SERVERLESS_PRICING[tier];
  
  const pricing = expectedIngestVolume && expectedIngestVolume.value > 0
    ? calculateServerlessCost({
        ingestGB: convertVolumeToGB(
          expectedIngestVolume.value,
          expectedIngestVolume.volumeUnit,
          expectedIngestVolume.timeUnit
        ),
        retentionGB: convertVolumeToGB(
          expectedIngestVolume.value,
          expectedIngestVolume.volumeUnit,
          expectedIngestVolume.timeUnit
        ) * 0.5, // Assume 50% average retention
        egressGB: 0, // User can estimate egress separately
        tier,
      })
    : { ingestCost: 0, retentionCost: 0, egressCost: 0, totalCost: 0 };

  const tierName = tier === 'logs_essentials' ? 'Logs Essentials' : 'Complete';

  return (
    <div className="bg-white border border-elastic-gray-200 rounded-lg p-5">
      <h4 className="text-sm font-semibold text-elastic-dark mb-3">
        Serverless Pricing ({tierName})
      </h4>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-elastic-gray-600">Ingest:</span>
          <span className="font-medium text-elastic-dark">
            ${tierPricing.ingestPerGB.toFixed(3)} per GB
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-elastic-gray-600">Retention:</span>
          <span className="font-medium text-elastic-dark">
            ${tierPricing.retentionPerGBPerMonth.toFixed(3)} per GB/month
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-elastic-gray-600">Egress:</span>
          <span className="font-medium text-elastic-dark">
            {tierPricing.egressFreeGB} GB free, then ${tierPricing.egressPerGB.toFixed(2)} per GB
          </span>
        </div>
      </div>

      {expectedIngestVolume && expectedIngestVolume.value > 0 && (
        <div className="mt-4 pt-4 border-t border-elastic-gray-200">
          <div className="text-xs font-medium text-elastic-dark mb-2">Estimated Monthly Cost:</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-elastic-gray-600">Ingest ({convertVolumeToGB(
                expectedIngestVolume.value,
                expectedIngestVolume.volumeUnit,
                expectedIngestVolume.timeUnit
              ).toLocaleString(undefined, { maximumFractionDigits: 0 })} GB):</span>
              <span className="font-medium text-elastic-dark">
                ${pricing.ingestCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-elastic-gray-600">Retention:</span>
              <span className="font-medium text-elastic-dark">
                ${pricing.retentionCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-elastic-gray-200">
              <span className="text-elastic-dark">Total:</span>
              <span className="text-elastic-blue">
                ${pricing.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <p className="text-xs text-elastic-gray-500 mt-2">
            Note: Egress costs not included. Add estimated egress volume for complete estimate.
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-elastic-gray-200">
        <p className="text-xs text-elastic-gray-500">
          Serverless pricing is based on actual usage. No infrastructure to manage.
          <a 
            href="https://www.elastic.co/pricing/serverless-observability" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-elastic-blue hover:text-elastic-blue-dark ml-1"
          >
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
}
