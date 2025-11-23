// File: @/lib/erc20/useERC20TotalSupply.ts
'use client';

import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { erc20Abi  } from 'viem';


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
