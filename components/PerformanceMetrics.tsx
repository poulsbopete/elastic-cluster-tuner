'use client';

import React from 'react';
import { PerformanceMetrics as PerformanceMetricsType } from '@/types';

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsType;
  deploymentType?: string;
}

export default function PerformanceMetrics({ metrics, deploymentType }: PerformanceMetricsProps) {
  const isServerless = deploymentType === 'serverless';
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const formatLatency = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms.toFixed(1)}ms`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-elastic-dark">Performance Metrics</h2>

      <div className="grid grid-cols-1 gap-3">
        {!isServerless && (
          <div className="bg-white border border-elastic-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="text-xs text-elastic-gray-600 font-medium mb-1 uppercase tracking-wide">Max Ingest Rate</div>
            <div className="text-2xl font-bold text-elastic-dark mb-1">
              {formatNumber(metrics.maxIngestRate)} <span className="text-base font-normal text-elastic-gray-600">ops/s</span>
            </div>
            <div className="text-xs text-elastic-gray-500">
              {metrics.opsPerCore ? `Based on ${metrics.opsPerCore} ops/core` : 'Theoretical maximum'}
            </div>
          </div>
        )}
        
        {isServerless && metrics.expectedIngestRate !== undefined && (
          <div className="bg-white border border-elastic-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="text-xs text-elastic-gray-600 font-medium mb-1 uppercase tracking-wide">Expected Ingest Rate</div>
            <div className="text-2xl font-bold text-elastic-blue mb-1">
              {formatNumber(metrics.expectedIngestRate)} <span className="text-base font-normal text-elastic-gray-600">ops/s</span>
            </div>
            <div className="text-xs text-elastic-gray-500">
              Serverless automatically scales to handle this volume
            </div>
          </div>
        )}
        
        {!isServerless && (
          <div className="bg-white border border-elastic-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="text-xs text-elastic-gray-600 font-medium mb-1 uppercase tracking-wide">Max Ingest Rate</div>
            <div className="text-2xl font-bold text-elastic-dark mb-1">
              {formatNumber(metrics.maxIngestRate)} <span className="text-base font-normal text-elastic-gray-600">ops/s</span>
            </div>
            <div className="text-xs text-elastic-gray-500">
              {metrics.opsPerCore ? `Based on ${metrics.opsPerCore} ops/core` : 'Theoretical maximum'}
            </div>
            {metrics.expectedIngestRate !== undefined && (
              <div className="mt-3 pt-3 border-t border-elastic-gray-200">
                <div className="text-xs text-elastic-gray-600 font-medium mb-1">Expected Rate</div>
                <div className="text-lg font-bold text-elastic-blue mb-1">
                  {formatNumber(metrics.expectedIngestRate)} <span className="text-sm font-normal text-elastic-gray-600">ops/s</span>
                </div>
                {metrics.capacityUtilization !== undefined && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-elastic-gray-600">Utilization</span>
                      <span className={`text-xs font-bold ${
                        metrics.capacityUtilization > 100 ? 'text-red-600' :
                        metrics.capacityUtilization > 80 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {metrics.capacityUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-elastic-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          metrics.capacityUtilization > 100 ? 'bg-red-500' :
                          metrics.capacityUtilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(metrics.capacityUtilization, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!isServerless && (
          <>
            <div className="bg-white border border-elastic-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="text-xs text-elastic-gray-600 font-medium mb-1 uppercase tracking-wide">Query Latency</div>
              <div className="text-2xl font-bold text-elastic-dark mb-1">
                {formatLatency(metrics.avgQueryLatency)}
              </div>
              <div className="text-xs text-elastic-gray-500">
                Weighted average
              </div>
            </div>

            <div className="bg-white border border-elastic-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="text-xs text-elastic-gray-600 font-medium mb-1 uppercase tracking-wide">Ingest Latency</div>
              <div className="text-2xl font-bold text-elastic-dark mb-1">
                {formatLatency(metrics.avgIngestLatency)}
              </div>
              <div className="text-xs text-elastic-gray-500">
                Per document
              </div>
            </div>

            <div className="bg-white border border-elastic-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="text-xs text-elastic-gray-600 font-medium mb-1 uppercase tracking-wide">Storage Efficiency</div>
              <div className="text-2xl font-bold text-elastic-dark mb-1">
                {metrics.storageEfficiency.toFixed(1)}%
              </div>
              <div className="text-xs text-elastic-gray-500">
                Based on storage type
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-elastic-gray-200 rounded-lg p-4">
        <h3 className="text-base font-semibold mb-3 text-elastic-dark">Estimated Monthly Cost</h3>
        <div className="text-3xl font-bold text-elastic-blue mb-3">
          ${metrics.costEstimate.toLocaleString()}
        </div>
        {(metrics.computeCost !== undefined || metrics.storageCost !== undefined) && (
          <div className="space-y-2 pt-3 border-t border-elastic-gray-200">
            {metrics.computeCost !== undefined && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-elastic-gray-600">Compute:</span>
                <span className="font-medium text-elastic-dark">${metrics.computeCost.toLocaleString()}</span>
              </div>
            )}
            {metrics.storageCost !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-elastic-gray-600">Storage:</span>
                  <span className="font-medium text-elastic-dark">${metrics.storageCost.toLocaleString()}</span>
                </div>
                {metrics.storageCost > 200000 && (
                  <div className="text-xs text-elastic-gray-500 pl-2">
                    Includes blob storage for frozen tier
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-elastic-gray-500 mt-3">
          Based on compute and storage pricing
        </p>
        <p className="text-xs text-elastic-gray-400 mt-1">
          Annual: ${(metrics.costEstimate * 12).toLocaleString()}
        </p>
      </div>

      {!isServerless && (
        <div className="bg-white border border-elastic-gray-200 rounded-lg p-4">
          <h3 className="text-base font-semibold mb-3 text-elastic-dark">Storage Summary</h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-elastic-gray-600">Total Storage</span>
              <span className="text-sm font-medium text-elastic-dark">
                {metrics.totalStorageGB >= 1024 * 1024
                  ? `${(metrics.totalStorageGB / 1024 / 1024).toFixed(2)} PB`
                  : metrics.totalStorageGB >= 1024
                  ? `${(metrics.totalStorageGB / 1024).toFixed(2)} TB`
                  : `${metrics.totalStorageGB.toFixed(0)} GB`}
              </span>
            </div>
            {metrics.compressedStorageGB && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-elastic-gray-600">Compressed (Cold/Frozen)</span>
                <span className="text-sm font-medium text-elastic-dark">
                  {metrics.compressedStorageGB >= 1024 * 1024
                    ? `${(metrics.compressedStorageGB / 1024 / 1024).toFixed(2)} PB`
                    : metrics.compressedStorageGB >= 1024
                    ? `${(metrics.compressedStorageGB / 1024).toFixed(2)} TB`
                    : `${metrics.compressedStorageGB.toFixed(0)} GB`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {metrics.recommendations && metrics.recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-base font-semibold mb-2 text-elastic-dark">Recommendations</h3>
          <ul className="space-y-1 text-sm text-elastic-gray-700">
            {metrics.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isServerless && (
        <div className="bg-white border border-elastic-gray-200 rounded-lg p-4">
          <h3 className="text-base font-semibold mb-3 text-elastic-dark">Tier Breakdown</h3>
          <div className="space-y-3">
            {metrics.tierBreakdown.map((tier) => (
              <div key={tier.tier} className="border border-elastic-gray-200 rounded-lg p-3 bg-elastic-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm capitalize text-elastic-dark">{tier.tier} Tier</span>
                  <span className="text-xs text-elastic-gray-500">
                    {formatNumber(tier.storageUsed)} GB
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-elastic-gray-600">Ingest: </span>
                    <span className="font-medium text-elastic-dark">{formatNumber(tier.ingestCapacity)} ops/s</span>
                  </div>
                  <div>
                    <span className="text-elastic-gray-600">Query: </span>
                    <span className="font-medium text-elastic-dark">{formatLatency(tier.queryPerformance)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
