// File: lib/erc20/useERC20TotalSupply.ts
'use client';

import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { Address } from 'viem';

export function useTotalSupply(tokenAddress?: Address) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'totalSupply',
    query: {
      enabled: Boolean(tokenAddress),
    },
  });
}
