'use client';

import React from 'react';
import { PerformanceMetrics as PerformanceMetricsType } from '@/types';

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsType;
}

export default function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
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
      <h2 className="text-2xl font-bold text-gray-800">Performance Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium mb-1">Max Ingest Rate</div>
          <div className="text-2xl font-bold text-blue-800">
            {formatNumber(metrics.maxIngestRate)} docs/s
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Theoretical maximum
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium mb-1">Avg Query Latency</div>
          <div className="text-2xl font-bold text-green-800">
            {formatLatency(metrics.avgQueryLatency)}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Weighted average
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium mb-1">Avg Ingest Latency</div>
          <div className="text-2xl font-bold text-purple-800">
            {formatLatency(metrics.avgIngestLatency)}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            Per document
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
          <div className="text-sm text-orange-600 font-medium mb-1">Storage Efficiency</div>
          <div className="text-2xl font-bold text-orange-800">
            {metrics.storageEfficiency.toFixed(1)}%
          </div>
          <div className="text-xs text-orange-600 mt-1">
            Based on storage type
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Estimated Monthly Cost</h3>
        <div className="text-3xl font-bold text-elastic-dark">
          ${metrics.costEstimate.toLocaleString()}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Based on node count and hardware configuration
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Tier Breakdown</h3>
        <div className="space-y-3">
          {metrics.tierBreakdown.map((tier) => (
            <div key={tier.tier} className="border border-gray-200 rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium capitalize">{tier.tier} Tier</span>
                <span className="text-sm text-gray-500">
                  {formatNumber(tier.storageUsed)} GB storage
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Ingest Capacity: </span>
                  <span className="font-medium">{formatNumber(tier.ingestCapacity)} docs/s</span>
                </div>
                <div>
                  <span className="text-gray-600">Query Latency: </span>
                  <span className="font-medium">{formatLatency(tier.queryPerformance)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
