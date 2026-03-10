// File: components/shared/utils/isDuplicateAddress.ts

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
  if (!isDuplicateAddress(a.address, b.address) || a.chainId !== b.chainId) return false;

  const norm = (value: unknown) =>
    typeof value === 'string' ? value.trim() : '';
  const normNum = (value: unknown, fallback = -1) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  const normBigInt = (value: unknown) =>
    typeof value === 'bigint' ? value.toString() : '';
  const normStringArray = (value: unknown) =>
    Array.isArray(value) ? value.map((item) => norm(item)).join('|') : '';

  return (
    norm(a.name) === norm(b.name) &&
    norm(a.symbol) === norm(b.symbol) &&
    normNum(a.decimals) === normNum(b.decimals) &&
    norm(a.logoURL) === norm(b.logoURL) &&
    norm(a.website) === norm(b.website) &&
    norm(a.description) === norm(b.description) &&
    norm(a.infoURL) === norm(b.infoURL) &&
    norm(a.explorer) === norm(b.explorer) &&
    norm(a.research) === norm(b.research) &&
    norm(a.rpc_url) === norm(b.rpc_url) &&
    normNum(a.coin_type) === normNum(b.coin_type) &&
    normStringArray(a.tags) === normStringArray(b.tags) &&
    normBigInt(a.balance) === normBigInt(b.balance) &&
    normBigInt(a.amount) === normBigInt(b.amount)
  );
};
