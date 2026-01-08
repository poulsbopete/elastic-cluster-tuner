'use client';

import React, { useState, useMemo } from 'react';
import { ClusterConfig, TierConfig, DeploymentType } from '@/types';
import { calculatePerformanceMetrics, getDefaultTierConfig } from '@/lib/calculations';
import TierConfigComponent from '@/components/TierConfig';
import PerformanceMetrics from '@/components/PerformanceMetrics';
import DeploymentSelector from '@/components/DeploymentSelector';

export default function Home() {
  const [deploymentType, setDeploymentType] = useState<DeploymentType>('elastic_cloud');
  const [tiers, setTiers] = useState<TierConfig[]>([
    getDefaultTierConfig('hot'),
    getDefaultTierConfig('warm'),
    getDefaultTierConfig('cold'),
    getDefaultTierConfig('frozen'),
    getDefaultTierConfig('deep_freeze'),
  ]);

  const clusterConfig: ClusterConfig = useMemo(() => ({
    deploymentType,
    tiers,
    totalNodes: tiers.reduce((sum, tier) => sum + (tier.enabled ? tier.nodeCount : 0), 0),
  }), [deploymentType, tiers]);

  const performanceMetrics = useMemo(() => {
    return calculatePerformanceMetrics(clusterConfig);
  }, [clusterConfig]);

  const handleTierChange = (index: number, updatedTier: TierConfig) => {
    const newTiers = [...tiers];
    newTiers[index] = updatedTier;
    setTiers(newTiers);
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-elastic-dark">
            Elastic Cluster Tuner
          </h1>
          <p className="text-gray-600 mt-1">
            Configure your Elastic cluster and estimate performance impact
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <DeploymentSelector
              deploymentType={deploymentType}
              onChange={setDeploymentType}
            />

            <div>
              <h2 className="text-xl font-semibold mb-4">Tier Configuration</h2>
              <div className="space-y-4">
                {tiers.map((tier, index) => (
                  <TierConfigComponent
                    key={tier.type}
                    tier={tier}
                    onChange={(updatedTier) => handleTierChange(index, updatedTier)}
                  />
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Configuration Summary</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div>Total Nodes: <strong>{clusterConfig.totalNodes}</strong></div>
                <div>Enabled Tiers: <strong>{tiers.filter(t => t.enabled).length}</strong></div>
                <div>Deployment: <strong className="capitalize">{deploymentType.replace('_', ' ')}</strong></div>
              </div>
            </div>
          </div>

          {/* Performance Metrics Panel */}
          <div className="lg:col-span-1">
            <PerformanceMetrics metrics={performanceMetrics} />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-500 text-center">
            These are theoretical estimates based on typical Elasticsearch performance characteristics.
            Actual performance may vary based on data structure, query patterns, and workload.
          </p>
        </div>
      </footer>
    </div>
  );
}
