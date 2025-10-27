// File: lib/erc20/useERC20Decimals.ts
'use client';

import { useReadContract } from 'wagmi';
import { erc20Abi , Address } from 'viem';


export function useDecimals(tokenAddress: Address) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
  });
}