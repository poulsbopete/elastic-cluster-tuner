'use client';

import React from 'react';
import { HardwareSKU, TierType } from '@/types';
import { getSKUsForDeployment } from '@/lib/skus';

interface HardwareSKUSelectorProps {
  deploymentType: string;
  tierType: TierType;
  selectedSKUId?: string;
  onSelect: (sku: HardwareSKU) => void;
}

export default function HardwareSKUSelector({
  deploymentType,
  tierType,
  selectedSKUId,
  onSelect,
}: HardwareSKUSelectorProps) {
  const skus = getSKUsForDeployment(deploymentType as any);

  if (skus.length === 0) {
    return (
      <div className="bg-elastic-gray-50 border border-elastic-gray-200 rounded-lg p-4">
        <p className="text-sm text-elastic-gray-600">
          No SKUs available for this deployment type. Please configure hardware manually.
        </p>
      </div>
    );
  }

  const formatStorage = (gb: number) => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    return `${gb} GB`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Pay per use';
    return `$${cost.toLocaleString()}/mo`;
  };

  return (
    <div className="bg-white border border-elastic-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-elastic-gray-50 border-b border-elastic-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-elastic-gray-700 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-elastic-gray-700 uppercase tracking-wider">
                CPU
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-elastic-gray-700 uppercase tracking-wider">
                Memory
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-elastic-gray-700 uppercase tracking-wider">
                Storage
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-elastic-gray-700 uppercase tracking-wider">
                IOPS
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-elastic-gray-700 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-elastic-gray-700 uppercase tracking-wider w-20">
                Select
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-elastic-gray-200">
            {skus.map((sku) => {
              const isSelected = selectedSKUId === sku.id;
              return (
                <tr
                  key={sku.id}
                  className={`hover:bg-elastic-gray-50 transition-colors ${
                    isSelected ? 'bg-elastic-blue-light' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-elastic-dark">{sku.name}</div>
                    {sku.description && (
                      <div className="text-xs text-elastic-gray-500 mt-0.5">
                        {sku.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-elastic-gray-700">
                    {sku.cpuCores} cores
                  </td>
                  <td className="px-4 py-3 text-sm text-elastic-gray-700">
                    {sku.memoryGB} GB
                  </td>
                  <td className="px-4 py-3 text-sm text-elastic-gray-700">
                    <div className="flex items-center gap-1">
                      <span>{formatStorage(sku.storageSizeGB)}</span>
                      <span className="text-xs text-elastic-gray-500 uppercase">
                        ({sku.storageType})
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-elastic-gray-700">
                    {sku.iops.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-elastic-dark">
                    {formatCost(sku.costPerMonth)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onSelect(sku)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        isSelected
                          ? 'bg-elastic-blue text-white hover:bg-elastic-blue-dark'
                          : 'bg-elastic-gray-100 text-elastic-gray-700 hover:bg-elastic-gray-200'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
