// File: lib/erc20/useERC20Name.ts
'use client';

import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { Address } from 'viem';

export function useName(tokenAddress: Address) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'name',
  });
}