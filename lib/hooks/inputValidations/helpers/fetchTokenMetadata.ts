// File: lib/hooks/inputValidations/helpers/fetchTokenMetadata.ts

import { Address, PublicClient } from 'viem';
import { TokenMetadata } from '../types/validationTypes';
import { erc20Abi } from 'viem';

/**
 * Fetch metadata (name, symbol, decimals, totalSupply) from an ERC-20 contract.
 */
export async function fetchTokenMetadata(
  tokenAddress: Address,
  publicClient: PublicClient // ⛏️ make this required
): Promise<TokenMetadata | undefined> {
  if (!publicClient) {
    console.warn(`⚠️ fetchTokenMetadata called without a publicClient for ${tokenAddress}`);
    return undefined;
  }

  try {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'name',
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'totalSupply',
      }),
    ]);

    return {
      name: name as string,
      symbol: symbol as string,
      decimals: decimals as number,
      totalSupply: totalSupply as bigint,
    };
  } catch (err) {
    console.warn(`⚠️ fetchTokenMetadata failed for ${tokenAddress}`, err);
    return undefined;
  }
}
