import { DeploymentType, TierConfig, IngestVolumeConfig, InfrastructureNodes } from '@/types';

const STORAGE_KEY = 'elastic-cluster-tuner-config';

export interface SavedConfig {
  deploymentType: DeploymentType;
  tiers: TierConfig[];
  expectedIngestVolume?: IngestVolumeConfig;
  infrastructureNodes?: InfrastructureNodes;
  opsPerCore?: number;
}

export function saveConfig(config: SavedConfig): void {
  if (typeof window === 'undefined') return; // SSR check
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save configuration to localStorage:', error);
  }
}

export function loadConfig(): SavedConfig | null {
  if (typeof window === 'undefined') return null; // SSR check
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as SavedConfig;
    }
  } catch (error) {
    console.error('Failed to load configuration from localStorage:', error);
  }
  
  return null;
}

export function clearConfig(): void {
  if (typeof window === 'undefined') return; // SSR check
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear configuration from localStorage:', error);
  }
}
