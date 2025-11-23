// File: @/lib/network/defaults.ts
import defaultEthereumSettings from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings.json';
import defaultPolygonSettings  from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings.json';
import defaultHardHatSettings  from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings.json';
import defaultSepoliaSettings  from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings.json';

import { CHAIN_ID } from '@/lib/structure';

/**
 * Normalizes various forms of chain identifiers (number, string, or object) into a standard form.
 */
export const normalizeChainId = (chain: unknown): number | string => {
  if (typeof chain === 'number') return chain;
  if (typeof chain === 'string') return chain.toLowerCase();
  if (typeof chain === 'object' && chain && 'id' in (chain as any)) return (chain as any).id;
  return CHAIN_ID.ETHEREUM;
};

/**
 * Returns default settings for the specified chain.
 * Falls back to Ethereum settings by default.
 */
export const getDefaultNetworkSettings = (chain: unknown) => {
  const normalized = normalizeChainId(chain);

  switch (normalized) {
    case CHAIN_ID.ETHEREUM:
    case 'ethereum':
      return defaultEthereumSettings;

    case CHAIN_ID.POLYGON:
    case 'polygon':
      return defaultPolygonSettings;

    case CHAIN_ID.HARDHAT:
    case 'hardhat':
      return defaultHardHatSettings;

    case CHAIN_ID.SEPOLIA:
    case 'sepolia':
      return defaultSepoliaSettings;

    // If you later add BASE (or others), map them here; otherwise fall back:
    default:
      return defaultEthereumSettings;
  }
};
