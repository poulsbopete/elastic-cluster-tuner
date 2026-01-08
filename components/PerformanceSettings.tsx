'use client';

import React from 'react';

interface PerformanceSettingsProps {
  opsPerCore: number;
  onChange: (opsPerCore: number) => void;
}

export default function PerformanceSettings({ opsPerCore, onChange }: PerformanceSettingsProps) {
  // Calculate example for 32 vCPU node (PB-scale standard)
  const example32Core = opsPerCore * 32;
  const example160Nodes = example32Core * 160; // PB-scale hot tier

  return (
    <div className="bg-white border border-elastic-gray-200 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-elastic-dark mb-4">Performance Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
            Operations per Core (ops/core)
          </label>
          <input
            type="number"
            min="2000"
            max="2500"
            step="50"
            value={opsPerCore}
            onChange={(e) => onChange(parseInt(e.target.value) || 2000)}
            className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
          />
          <div className="mt-2 text-xs text-elastic-gray-600 space-y-1">
            <p>• Default: 2000 ops/core (recommended baseline)</p>
            <p>• Typical range: 2000-2500 ops/core</p>
            <p>• Performance is consistent within this range</p>
          </div>
        </div>

        <div className="bg-elastic-blue-light border border-elastic-blue rounded-md p-3">
          <div className="text-xs font-medium text-elastic-dark mb-2">Calculation Example (32 vCPU node):</div>
          <div className="text-sm text-elastic-gray-700 space-y-1">
            <div className="flex justify-between">
              <span>Per node:</span>
              <span className="font-mono font-medium">{example32Core.toLocaleString()} ops/sec</span>
            </div>
            <div className="text-xs text-elastic-gray-600">
              = {opsPerCore} ops/core × 32 cores
            </div>
          </div>
        </div>

        <div className="bg-elastic-gray-50 border border-elastic-gray-200 rounded-md p-3">
          <div className="text-xs font-medium text-elastic-dark mb-2">PB-Scale Example (160 hot nodes, 32 vCPU each):</div>
          <div className="text-sm text-elastic-gray-700 space-y-1">
            <div className="flex justify-between">
              <span>Total capacity:</span>
              <span className="font-mono font-medium">{(example160Nodes / 1000000).toFixed(2)}M ops/sec</span>
            </div>
            <div className="text-xs text-elastic-gray-600">
              = {example32Core.toLocaleString()} ops/node × 160 nodes
            </div>
            {opsPerCore === 2000 && (
              <div className="text-xs text-elastic-gray-500 mt-2 pt-2 border-t border-elastic-gray-200">
                Note: At 2000 ops/core, this equals 12.8M ops/sec. 
                For 15M ops/sec average, use ~2344 ops/core.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
