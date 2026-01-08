'use client';

import React from 'react';
import { InfrastructureNodes as InfrastructureNodesType } from '@/types';

interface InfrastructureNodesProps {
  infrastructure: InfrastructureNodesType | undefined;
  onChange: (infrastructure: InfrastructureNodesType | undefined) => void;
}

export default function InfrastructureNodes({ infrastructure, onChange }: InfrastructureNodesProps) {
  const handleChange = (field: keyof InfrastructureNodesType, value: number) => {
    const current = infrastructure || {
      masterNodes: 0,
      coordinatingNodes: 0,
      mlNodes: 0,
      kibanaNodes: 0,
    };
    onChange({ ...current, [field]: value });
  };

  return (
    <div className="bg-white border border-elastic-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-elastic-dark">Infrastructure Nodes</h3>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!!infrastructure}
            onChange={(e) => {
              if (e.target.checked) {
                onChange({
                  masterNodes: 3,
                  coordinatingNodes: 0,
                  mlNodes: 1,
                  kibanaNodes: 2,
                });
              } else {
                onChange(undefined);
              }
            }}
            className="mr-2 w-4 h-4 text-elastic-blue focus:ring-elastic-blue border-elastic-gray-300 rounded"
          />
          <span className="text-sm font-medium text-elastic-gray-700">Configure</span>
        </label>
      </div>

      {infrastructure && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
              Master Nodes
            </label>
            <input
              type="number"
              min="0"
              value={infrastructure.masterNodes}
              onChange={(e) => handleChange('masterNodes', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
            />
            <p className="text-xs text-elastic-gray-500 mt-1">Recommended: 3 (for HA)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
              Coordinating/Ingress Nodes
            </label>
            <input
              type="number"
              min="0"
              value={infrastructure.coordinatingNodes}
              onChange={(e) => handleChange('coordinatingNodes', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
            />
            <p className="text-xs text-elastic-gray-500 mt-1">Optional: For dedicated ingest/query</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
              ML Nodes
            </label>
            <input
              type="number"
              min="0"
              value={infrastructure.mlNodes}
              onChange={(e) => handleChange('mlNodes', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
            />
            <p className="text-xs text-elastic-gray-500 mt-1">For machine learning jobs</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
              Kibana/UI Nodes
            </label>
            <input
              type="number"
              min="0"
              value={infrastructure.kibanaNodes}
              onChange={(e) => handleChange('kibanaNodes', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
            />
            <p className="text-xs text-elastic-gray-500 mt-1">Recommended: 2 (for HA)</p>
          </div>
        </div>
      )}
    </div>
  );
}
