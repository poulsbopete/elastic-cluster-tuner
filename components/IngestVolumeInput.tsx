'use client';

import React from 'react';
import { IngestVolumeConfig } from '@/types';
import { volumeToDocsPerSecond, formatDocsPerSecond } from '@/lib/ingestVolume';

interface IngestVolumeInputProps {
  volume: IngestVolumeConfig | undefined;
  onChange: (volume: IngestVolumeConfig | undefined) => void;
  maxIngestRate: number;
  deploymentType?: string; // Optional to determine if we should show capacity warnings
}

export default function IngestVolumeInput({ volume, onChange, maxIngestRate, deploymentType }: IngestVolumeInputProps) {
  const handleChange = (field: keyof IngestVolumeConfig, value: any) => {
    if (!volume) {
      // Initialize with defaults
      onChange({
        value: 0,
        volumeUnit: 'PB',
        timeUnit: 'day',
        dataType: 'traces',
      });
      return;
    }
    onChange({ ...volume, [field]: value });
  };

  const expectedDocsPerSecond = volume && volume.value > 0 && volume.dataType
    ? volumeToDocsPerSecond(volume, volume.dataType)
    : undefined;

  // For serverless, don't show capacity warnings (no max capacity concept)
  const isServerless = deploymentType === 'serverless';
  const capacityUtilization = !isServerless && expectedDocsPerSecond && maxIngestRate > 0
    ? (expectedDocsPerSecond / maxIngestRate) * 100
    : undefined;

  const isOverCapacity = capacityUtilization && capacityUtilization > 100;
  const isNearCapacity = capacityUtilization && capacityUtilization > 80;

  return (
    <div className="bg-white border border-elastic-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-elastic-dark">Expected Ingest Volume</h3>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!!volume && volume.value > 0}
            onChange={(e) => {
              if (e.target.checked) {
                onChange({
                  value: 1.3,
                  volumeUnit: 'PB',
                  timeUnit: 'day',
                  dataType: 'traces',
                });
              } else {
                onChange(undefined);
              }
            }}
            className="mr-2 w-4 h-4 text-elastic-blue focus:ring-elastic-blue border-elastic-gray-300 rounded"
          />
          <span className="text-sm font-medium text-elastic-gray-700">Specify Volume</span>
        </label>
      </div>

      {volume && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
                Volume
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={volume.value || ''}
                onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
                placeholder="1.3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
                Unit
              </label>
              <select
                value={volume.volumeUnit || 'PB'}
                onChange={(e) => handleChange('volumeUnit', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900"
              >
                <option value="PB">PB</option>
                <option value="TB">TB</option>
                <option value="GB">GB</option>
                <option value="MB">MB</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
                Per
              </label>
              <select
                value={volume.timeUnit || 'day'}
                onChange={(e) => handleChange('timeUnit', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900"
              >
                <option value="day">Day</option>
                <option value="hour">Hour</option>
                <option value="minute">Minute</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
              Data Type
            </label>
            <select
              value={volume.dataType || 'traces'}
              onChange={(e) => handleChange('dataType', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900"
            >
              <option value="traces">OTLP Traces</option>
              <option value="logs">OTLP Logs</option>
              <option value="metrics">OTLP Metrics</option>
              <option value="custom">Custom</option>
            </select>
            <p className="text-xs text-elastic-gray-500 mt-1">
              Traces, logs, and metrics assume OpenTelemetry (OTLP) format. Use Custom for other formats.
            </p>
          </div>

          {volume.dataType === 'custom' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-elastic-gray-700">
                Avg Document Size (KB)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.1"
                value={volume.avgDocumentSizeKB || ''}
                onChange={(e) => handleChange('avgDocumentSizeKB', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 bg-white border border-elastic-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-elastic-blue focus:border-elastic-blue text-gray-900 placeholder-elastic-gray-400"
                placeholder="1.0"
              />
            </div>
          )}

          {expectedDocsPerSecond && (
            <div className={`border rounded-lg p-4 ${
              isServerless
                ? 'bg-blue-50 border-blue-200'
                : isOverCapacity
                ? 'bg-red-50 border-red-200'
                : isNearCapacity
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-elastic-dark">Expected Ingest Rate</span>
                <span className="text-sm font-bold text-elastic-dark">
                  {formatDocsPerSecond(expectedDocsPerSecond)}
                </span>
              </div>
              {!isServerless && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-elastic-dark">Max Capacity</span>
                    <span className="text-sm font-bold text-elastic-dark">
                      {formatDocsPerSecond(maxIngestRate)}
                    </span>
                  </div>
                </>
              )}
              {!isServerless && capacityUtilization !== undefined && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-elastic-gray-700">Capacity Utilization</span>
                    <span className={`text-xs font-bold ${
                      isOverCapacity ? 'text-red-600' : isNearCapacity ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {capacityUtilization.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-elastic-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isOverCapacity ? 'bg-red-500' : isNearCapacity ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(capacityUtilization, 100)}%` }}
                    />
                  </div>
                  {isOverCapacity && (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      ⚠️ Configuration cannot handle expected volume. Consider adding more nodes or upgrading hardware.
                    </p>
                  )}
                  {isNearCapacity && !isOverCapacity && (
                    <p className="text-xs text-yellow-600 mt-2">
                      ⚠️ Near capacity. Consider adding headroom for peak loads.
                    </p>
                  )}
                  {!isNearCapacity && capacityUtilization && capacityUtilization < 80 && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Configuration has sufficient capacity with {(100 - capacityUtilization).toFixed(1)}% headroom.
                    </p>
                  )}
                </div>
              )}
              {isServerless && (
                <p className="text-xs text-blue-600 mt-2">
                  ℹ️ Serverless automatically scales to handle your ingest volume. No capacity limits to configure.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
