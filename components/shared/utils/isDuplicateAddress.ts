// File: lib/spCoin/isDuplicateAddress.ts

import type { TokenContract } from '@/lib/structure';

/**
 * Case-insensitive check for whether two Ethereum addresses are equal.
 */
export const isDuplicateAddress = (addr1?: string, addr2?: string): boolean =>
  !!addr1 && !!addr2 && addr1.toLowerCase() === addr2.toLowerCase();

/**
 * Returns true if two token contracts refer to the same address and chain.
 * Address comparison is case-insensitive.
 */
export const tokenContractsEqual = (a?: TokenContract, b?: TokenContract): boolean => {
  if (!a || !b) return false;
  return isDuplicateAddress(a.address, b.address) && a.chainId === b.chainId;
};
