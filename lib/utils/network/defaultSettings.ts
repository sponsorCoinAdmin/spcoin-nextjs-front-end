// File: @/lib/utils/network/defaultSettings.ts

import defaultEthereumSettings from '@/resources/data/networks/ethereum/initialize/defaultNetworkSettings.json';
import defaultPolygonSettings from '@/resources/data/networks/polygon/initialize/defaultNetworkSettings.json';
import defaultHardHatSettings from '@/resources/data/networks/hardhat/initialize/defaultNetworkSettings.json';
import defaultSepoliaSettings from '@/resources/data/networks/sepolia/initialize/defaultNetworkSettings.json';
import defaultBaseSettings from '@/resources/data/networks/base/initialize/defaultNetworkSettings.json';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';
import { normalizeChainId } from './chains';

export const getDefaultNetworkSettings = (chain: unknown) => {
  const normalized = normalizeChainId(chain);

  switch (normalized) {
    case CHAIN_ID.ETHEREUM:
      return defaultEthereumSettings;
    case CHAIN_ID.POLYGON:
      return defaultPolygonSettings;
    case CHAIN_ID.HARDHAT:
      return defaultHardHatSettings;
    case CHAIN_ID.SEPOLIA:
      return defaultSepoliaSettings;
    case CHAIN_ID.BASE:
      return defaultBaseSettings;
    default:
      return defaultEthereumSettings;
  }
};

