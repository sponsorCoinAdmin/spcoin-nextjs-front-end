// File: lib/hooks/wagmi/ERC20/useName.ts
'use client';

import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { erc20Abi  } from 'viem';


export function useName(tokenAddress: Address) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'name',
  });
}
