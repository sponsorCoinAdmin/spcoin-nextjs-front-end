// File: lib/network/onchain/cacheKeys.ts
import type { Address } from 'viem';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure';

/** Normalize any native sentinel to your canonical NATIVE_TOKEN_ADDRESS */
function normalizeTokenAddress(addr: Address): Address {
  return (addr as string).toLowerCase() === (NATIVE_TOKEN_ADDRESS as string).toLowerCase()
    ? (NATIVE_TOKEN_ADDRESS as Address)
    : addr;
}

/**
 * Single source of truth for balance cache keys.
 * - Accepts Address only (no 'NATIVE' string).
 * - Collapses native sentinel(s) to NATIVE_TOKEN_ADDRESS.
 * - Lowercases inside the key for stability.
 */
export const BALANCE_KEY = (
  chainId: number,
  user: Address,
  tokenAddress: Address
) => {
  const userPart = (user as string).toLowerCase();
  const tokenPart = (normalizeTokenAddress(tokenAddress) as string).toLowerCase();
  return `balance:${chainId}:${userPart}:${tokenPart}`;
};

// Optional helper (exported if you want it)
export { normalizeTokenAddress };
