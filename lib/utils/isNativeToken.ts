// File: lib/utils/isNativeToken.ts

import { Address } from 'viem';
import { TokenContract } from '@/lib/structure/types';

const NATIVE_TOKEN_ADDRESSES: Record<number, Address> = {
  1: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Ethereum Mainnet
  137: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Polygon
  56: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // BSC
  10: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Optimism
  42161: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Arbitrum
};

/**
 * Check if the provided address is a native token address for the given chain.
 */
export function isNativeToken(address?: string | Address, chainId?: number): boolean {
  if (!address || !chainId) return false;
  const nativeAddress = NATIVE_TOKEN_ADDRESSES[chainId];
return nativeAddress?.toString().toLowerCase() === address.toString().toLowerCase();}

/**
 * Get the native token address for a given chain ID.
 */
export function getNativeTokenAddress(chainId: number): Address | undefined {
  return NATIVE_TOKEN_ADDRESSES[chainId];
}
