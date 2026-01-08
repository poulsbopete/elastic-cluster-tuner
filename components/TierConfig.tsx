'use client';

import React from 'react';
import { TierConfig as TierConfigType, TierType } from '@/types';

interface TierConfigProps {
  tier: TierConfigType;
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
  hot: 'bg-red-100 border-red-300 text-red-800',
  warm: 'bg-orange-100 border-orange-300 text-orange-800',
  cold: 'bg-blue-100 border-blue-300 text-blue-800',
  frozen: 'bg-cyan-100 border-cyan-300 text-cyan-800',
  deep_freeze: 'bg-indigo-100 border-indigo-300 text-indigo-800',
};

export default function TierConfig({ tier, onChange }: TierConfigProps) {
  const handleChange = (field: keyof TierConfigType, value: any) => {
    onChange({ ...tier, [field]: value });
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${tier.enabled ? TIER_COLORS[tier.type] : 'bg-gray-100 border-gray-300'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{TIER_LABELS[tier.type]} Tier</h3>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={tier.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="mr-2 w-4 h-4"
          />
          <span className="text-sm font-medium">Enable</span>
        </label>
      </div>

      {tier.enabled && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Retention Period (hours)
            </label>
            <input
              type="number"
              min="1"
              value={tier.retentionHours}
              onChange={(e) => handleChange('retentionHours', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue"
            />
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(tier.retentionHours / 24 * 10) / 10} days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Number of Nodes
            </label>
            <input
              type="number"
              min="1"
              value={tier.nodeCount}
              onChange={(e) => handleChange('nodeCount', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue"
            >
              <option value="nvme">NVMe (Premium)</option>
              <option value="ssd">SSD</option>
              <option value="hdd">HDD</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Storage Size (GB)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={tier.storageSizeGB}
                onChange={(e) => handleChange('storageSizeGB', parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                CPU Cores
              </label>
              <input
                type="number"
                min="1"
                value={tier.cpuCores}
                onChange={(e) => handleChange('cpuCores', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Memory (GB)
            </label>
            <input
              type="number"
              min="4"
              step="4"
              value={tier.memoryGB}
              onChange={(e) => handleChange('memoryGB', parseInt(e.target.value) || 4)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue"
            />
          </div>
        </div>
      )}
    </div>
  );
}
