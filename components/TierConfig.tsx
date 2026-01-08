'use client';

import React, { useState, useEffect } from 'react';
import { TierConfig as TierConfigType, TierType, HardwareSKU } from '@/types';
import HardwareSKUSelector from './HardwareSKUSelector';
import { getSKUById } from '@/lib/skus';

interface TierConfigProps {
  tier: TierConfigType;
  deploymentType: string;
  onChange: (tier: TierConfigType) => void;
}

const TIER_LABELS: Record<TierType, string> = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
  frozen: 'Frozen',
  deep_freeze: 'Deep Freeze',
};

const TIER_COLORS: Record<TierType, string> = {
  hot: 'bg-elastic-blue-light border-elastic-blue text-elastic-dark',
  warm: 'bg-orange-50 border-orange-200 text-elastic-dark',
  cold: 'bg-blue-50 border-blue-200 text-elastic-dark',
  frozen: 'bg-cyan-50 border-cyan-200 text-elastic-dark',
  deep_freeze: 'bg-indigo-50 border-indigo-200 text-elastic-dark',
};

export default function TierConfig({ tier, deploymentType, onChange }: TierConfigProps) {
  const [useSKU, setUseSKU] = useState(!!tier.skuId);
  const [showSKUSelector, setShowSKUSelector] = useState(false);

  // Reset SKU selector visibility when deployment type changes
  useEffect(() => {
    setShowSKUSelector(false);
    if (!tier.skuId) {
      setUseSKU(false);
    }
  }, [deploymentType, tier.skuId]);

  const handleChange = (field: keyof TierConfigType, value: any) => {
    onChange({ ...tier, [field]: value });
  };

  const handleSKUSelect = (sku: HardwareSKU) => {
    onChange({
      ...tier,
      skuId: sku.id,
      storageType: sku.storageType,
      storageSizeGB: sku.storageSizeGB,
      cpuCores: sku.cpuCores,
      memoryGB: sku.memoryGB,
      iops: sku.iops,
      throughputMBps: sku.throughputMBps,
    });
    setShowSKUSelector(false);
    setUseSKU(true);
  };

  const handleManualConfig = () => {
    setUseSKU(false);
    setShowSKUSelector(false);
    onChange({ ...tier, skuId: undefined });
  };

  return (
    <div className={`border rounded-lg p-5 bg-white ${tier.enabled ? TIER_COLORS[tier.type] : 'border-elastic-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-elastic-dark">{TIER_LABELS[tier.type]} Tier</h3>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={tier.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="mr-2 w-4 h-4 text-elastic-blue focus:ring-elastic-blue border-elastic-gray-300 rounded"
          />
          <span className="text-sm font-medium text-elastic-gray-700">Enable</span>
        </label>
      </div>

      {tier.enabled && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
              Retention Period (hours)
            </label>
            <input
              type="number"
              min="1"
              value={tier.retentionHours}
              onChange={(e) => handleChange('retentionHours', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
            />
            <p className="text-xs text-elastic-gray-500 mt-1">
              {Math.round(tier.retentionHours / 24 * 10) / 10} days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
              Number of Nodes
            </label>
            <input
              type="number"
              min="1"
              value={tier.nodeCount}
              onChange={(e) => handleChange('nodeCount', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
            />
          </div>

          {/* Hardware Configuration Section */}
          <div className="border-t border-elastic-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-elastic-dark">Hardware Configuration</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setUseSKU(true);
                    setShowSKUSelector(true);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    useSKU
                      ? 'bg-elastic-blue text-white'
                      : 'bg-elastic-gray-100 text-elastic-gray-700 hover:bg-elastic-gray-200'
                  }`}
                >
                  Choose SKU
                </button>
                <button
                  onClick={handleManualConfig}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    !useSKU
                      ? 'bg-elastic-blue text-white'
                      : 'bg-elastic-gray-100 text-elastic-gray-700 hover:bg-elastic-gray-200'
                  }`}
                >
                  Manual Config
                </button>
              </div>
            </div>

            {useSKU && tier.skuId && (
              <div className="mb-4 p-3 bg-elastic-blue-light border border-elastic-blue rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-elastic-dark">
                      {getSKUById(tier.skuId)?.name || 'Selected SKU'}
                    </div>
                    <div className="text-xs text-elastic-gray-600 mt-1">
                      {tier.cpuCores} cores • {tier.memoryGB} GB RAM • {tier.storageSizeGB} GB {tier.storageType.toUpperCase()}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSKUSelector(!showSKUSelector)}
                    className="text-xs text-elastic-blue hover:text-elastic-blue-dark font-medium"
                  >
                    {showSKUSelector ? 'Hide' : 'Change'} SKU
                  </button>
                </div>
              </div>
            )}

            {showSKUSelector && (
              <div className="mb-4">
                <HardwareSKUSelector
                  deploymentType={deploymentType}
                  tierType={tier.type}
                  selectedSKUId={tier.skuId}
                  onSelect={handleSKUSelect}
                />
              </div>
            )}

            {!useSKU && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
                    Storage Type
                  </label>
                  <select
                    value={tier.storageType}
                    onChange={(e) => {
                      const storageType = e.target.value as TierConfigType['storageType'];
                      // Update IOPS and throughput based on storage type
                      const updates: Partial<TierConfigType> = { storageType };
                      if (storageType === 'nvme') {
                        updates.iops = 50000;
                        updates.throughputMBps = 3000;
                      } else if (storageType === 'ssd') {
                        updates.iops = 10000;
                        updates.throughputMBps = 1000;
                      } else {
                        updates.iops = 300;
                        updates.throughputMBps = 200;
                      }
                      onChange({ ...tier, ...updates });
                    }}
                    className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900"
                  >
                    <option value="nvme">NVMe (Premium)</option>
                    <option value="ssd">SSD</option>
                    <option value="hdd">HDD</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
                      Storage Size (GB)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={tier.storageSizeGB}
                      onChange={(e) => handleChange('storageSizeGB', parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
                      CPU Cores
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={tier.cpuCores}
                      onChange={(e) => handleChange('cpuCores', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
                    Memory (GB)
                  </label>
                  <input
                    type="number"
                    min="4"
                    step="4"
                    value={tier.memoryGB}
                    onChange={(e) => handleChange('memoryGB', parseInt(e.target.value) || 4)}
                    className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
