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
      const parsed = JSON.parse(saved) as SavedConfig;
      
      // Validate and fix expectedIngestVolume if it exists but is missing required fields
      if (parsed.expectedIngestVolume) {
        const vol = parsed.expectedIngestVolume;
        if (!vol.dataType) vol.dataType = 'traces';
        if (!vol.volumeUnit) vol.volumeUnit = 'PB';
        if (!vol.timeUnit) vol.timeUnit = 'day';
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load configuration from localStorage:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
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
