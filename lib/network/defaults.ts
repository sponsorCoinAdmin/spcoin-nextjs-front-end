// File: lib/network/defaults.ts

import defaultEthereumSettings from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings.json';
import defaultPolygonSettings from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings.json';
import defaultHardHatSettings from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings.json';
import defaultSoliditySettings from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings.json';

import { ETHEREUM, POLYGON, HARDHAT, SEPOLIA } from '@/lib/structure';

/**
 * Normalizes various forms of chain identifiers (number, string, or object) into a standard form.
 */
export const normalizeChainId = (chain: unknown): number | string => {
  if (typeof chain === 'number') return chain;
  if (typeof chain === 'string') return chain.toLowerCase();
  if (typeof chain === 'object' && chain && 'id' in chain) return (chain as any).id;
  return ETHEREUM;
};

/**
 * Returns default settings for the specified chain.
 * Falls back to Ethereum settings by default.
 */
export const getDefaultNetworkSettings = (chain: unknown) => {
  const normalized = normalizeChainId(chain);

  switch (normalized) {
    case ETHEREUM:
    case 'ethereum':
      return defaultEthereumSettings;
    case POLYGON:
    case 'polygon':
      return defaultPolygonSettings;
    case HARDHAT:
    case 'hardhat':
      return defaultHardHatSettings;
    case SEPOLIA:
    case 'sepolia':
      return defaultSoliditySettings;
    default:
      return defaultEthereumSettings;
  }
};
