'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ClusterConfig, TierConfig, DeploymentType, IngestVolumeConfig, InfrastructureNodes } from '@/types';
import { calculatePerformanceMetrics, getDefaultTierConfig } from '@/lib/calculations';
import { saveConfig, loadConfig } from '@/lib/storage';
import TierConfigComponent from '@/components/TierConfig';
import PerformanceMetrics from '@/components/PerformanceMetrics';
import DeploymentSelector from '@/components/DeploymentSelector';
import IngestVolumeInput from '@/components/IngestVolumeInput';
import InfrastructureNodesComponent from '@/components/InfrastructureNodes';
import PerformanceSettings from '@/components/PerformanceSettings';
import ServerlessPricingInfo from '@/components/ServerlessPricingInfo';

export default function Home() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [deploymentType, setDeploymentType] = useState<DeploymentType>('elastic_cloud');
  const [tiers, setTiers] = useState<TierConfig[]>([
    getDefaultTierConfig('hot'),
    getDefaultTierConfig('warm'),
    getDefaultTierConfig('cold'),
    getDefaultTierConfig('frozen'),
    getDefaultTierConfig('deep_freeze'),
  ]);
  const [expectedIngestVolume, setExpectedIngestVolume] = useState<IngestVolumeConfig | undefined>(undefined);
  const [infrastructureNodes, setInfrastructureNodes] = useState<InfrastructureNodes | undefined>(undefined);
  const [opsPerCore, setOpsPerCore] = useState<number>(2000); // Default: 2000 ops/core (recommended baseline)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    const saved = loadConfig();
    if (saved) {
      setDeploymentType(saved.deploymentType);
      setTiers(saved.tiers);
      if (saved.expectedIngestVolume) {
        setExpectedIngestVolume(saved.expectedIngestVolume);
      }
      if (saved.infrastructureNodes) {
        setInfrastructureNodes(saved.infrastructureNodes);
      }
      if (saved.opsPerCore) {
        setOpsPerCore(saved.opsPerCore);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isHydrated) {
      saveConfig({
        deploymentType,
        tiers,
        expectedIngestVolume,
        infrastructureNodes,
        opsPerCore,
      });
    }
  }, [deploymentType, tiers, expectedIngestVolume, infrastructureNodes, opsPerCore, isHydrated]);

  const clusterConfig: ClusterConfig = useMemo(() => ({
    deploymentType,
    tiers,
    totalNodes: tiers.reduce((sum, tier) => sum + (tier.enabled ? tier.nodeCount : 0), 0),
    expectedIngestVolume,
    infrastructureNodes,
    opsPerCore,
  }), [deploymentType, tiers, expectedIngestVolume, infrastructureNodes, opsPerCore]);

  const performanceMetrics = useMemo(() => {
    return calculatePerformanceMetrics(clusterConfig);
  }, [clusterConfig]);

  const handleTierChange = (index: number, updatedTier: TierConfig) => {
    const newTiers = [...tiers];
    newTiers[index] = updatedTier;
    setTiers(newTiers);
  };

  const handleDeploymentTypeChange = (newDeploymentType: DeploymentType) => {
    setDeploymentType(newDeploymentType);
  };

  return (
    <div className="min-h-screen bg-elastic-gray-50">
      <header className="bg-white border-b border-elastic-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-elastic-blue rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <h1 className="text-3xl font-bold text-elastic-dark">
              Elastic Cluster Tuner
            </h1>
          </div>
          <p className="text-elastic-gray-600 text-base">
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
              onChange={handleDeploymentTypeChange}
            />

            {deploymentType !== 'serverless' && (
              <PerformanceSettings
                opsPerCore={opsPerCore}
                onChange={setOpsPerCore}
              />
            )}

            <IngestVolumeInput
              volume={expectedIngestVolume}
              onChange={setExpectedIngestVolume}
              maxIngestRate={performanceMetrics.maxIngestRate}
            />

            {deploymentType === 'serverless' && (
              <ServerlessPricingInfo
                expectedIngestVolume={expectedIngestVolume}
                tier="complete"
              />
            )}

            <InfrastructureNodesComponent
              infrastructure={infrastructureNodes}
              onChange={setInfrastructureNodes}
            />

            <div>
              <h2 className="text-xl font-semibold mb-4 text-elastic-dark">Tier Configuration</h2>
              <div className="space-y-4">
                {tiers.map((tier, index) => (
                  <TierConfigComponent
                    key={tier.type}
                    tier={tier}
                    deploymentType={deploymentType}
                    onChange={(updatedTier) => handleTierChange(index, updatedTier)}
                  />
                ))}
              </div>
            </div>

            <div className="bg-elastic-blue-light border border-elastic-blue rounded-lg p-4">
              <h3 className="font-semibold text-elastic-dark mb-2">Configuration Summary</h3>
              <div className="text-sm text-elastic-gray-700 space-y-1">
                <div>Total Nodes: <strong className="text-elastic-dark">{clusterConfig.totalNodes}</strong></div>
                <div>Enabled Tiers: <strong className="text-elastic-dark">{tiers.filter(t => t.enabled).length}</strong></div>
                <div>Deployment: <strong className="text-elastic-dark capitalize">{deploymentType.replace('_', ' ')}</strong></div>
              </div>
            </div>
          </div>

          {/* Performance Metrics Panel */}
          <div className="lg:col-span-1">
            <PerformanceMetrics metrics={performanceMetrics} />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-elastic-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-elastic-gray-500 text-center">
            These are theoretical estimates based on typical Elasticsearch performance characteristics.
            Actual performance may vary based on data structure, query patterns, and workload.
          </p>
        </div>
      </footer>
    </div>
  );
}
