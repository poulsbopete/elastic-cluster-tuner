'use client';

import React from 'react';
import { DeploymentType } from '@/types';

interface DeploymentSelectorProps {
  deploymentType: DeploymentType;
  onChange: (type: DeploymentType) => void;
}

const DEPLOYMENT_OPTIONS: { value: DeploymentType; label: string; description: string }[] = [
  { value: 'on_prem', label: 'On-Premises', description: 'Self-hosted infrastructure' },
  { value: 'aws', label: 'AWS', description: 'Amazon Web Services' },
  { value: 'gcp', label: 'GCP', description: 'Google Cloud Platform' },
  { value: 'azure', label: 'Azure', description: 'Microsoft Azure' },
  { value: 'elastic_cloud', label: 'Elastic Cloud', description: 'Managed Elasticsearch service' },
  { value: 'serverless', label: 'Serverless', description: 'Elastic Serverless' },
];

export default function DeploymentSelector({ deploymentType, onChange }: DeploymentSelectorProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Deployment Type</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {DEPLOYMENT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`p-3 border-2 rounded-lg text-left transition-all ${
              deploymentType === option.value
                ? 'border-elastic-blue bg-elastic-blue bg-opacity-10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm">{option.label}</div>
            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
