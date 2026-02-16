// File: @/lib/utils/network/chains.ts

import { CHAIN_ID } from '@/lib/structure/enums/networkIds';

export const DEFAULT_CHAIN_ID = CHAIN_ID.ETHEREUM;

const CHAIN_ALIASES: Record<string, number> = {
  ethereum: CHAIN_ID.ETHEREUM,
  mainnet: CHAIN_ID.ETHEREUM,
  eth: CHAIN_ID.ETHEREUM,
  polygon: CHAIN_ID.POLYGON,
  matic: CHAIN_ID.POLYGON,
  hardhat: CHAIN_ID.HARDHAT,
  sepolia: CHAIN_ID.SEPOLIA,
  base: CHAIN_ID.BASE,
  goerli: CHAIN_ID.GOERLI,
  mumbai: CHAIN_ID.MUMBAI,
};

export const TESTNET_CHAIN_IDS = new Set<number>([
  CHAIN_ID.GOERLI,
  CHAIN_ID.SEPOLIA,
  CHAIN_ID.MUMBAI,
  CHAIN_ID.HARDHAT,
  1337, // local hardhat alias used by some tools
]);

export const isTestnetChainId = (chainId: number): boolean =>
  TESTNET_CHAIN_IDS.has(Number(chainId));

export const normalizeChainId = (
  chain: unknown,
  fallback: number = DEFAULT_CHAIN_ID,
): number => {
  if (typeof chain === 'number' && Number.isFinite(chain)) return chain;

  if (typeof chain === 'object' && chain && 'id' in (chain as any)) {
    const id = Number((chain as any).id);
    if (Number.isFinite(id)) return id;
  }

  if (typeof chain === 'string') {
    const trimmed = chain.trim();
    const numeric = Number(trimmed);
    if (trimmed.length > 0 && Number.isFinite(numeric)) return numeric;

    const alias = CHAIN_ALIASES[trimmed.toLowerCase()];
    if (typeof alias === 'number') return alias;
  }

  return fallback;
};

