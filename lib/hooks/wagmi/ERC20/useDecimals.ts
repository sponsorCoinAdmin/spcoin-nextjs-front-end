// File: lib/hooks/wagmi/ERC20/useDecimals.ts
'use client';

import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { erc20Abi  } from 'viem';


export function useDecimals(tokenAddress: Address) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
  });
}
