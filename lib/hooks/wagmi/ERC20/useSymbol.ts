// File: lib/erc20/useERC20Symbol.ts
'use client';

import { useReadContract } from 'wagmi';
import { erc20Abi , Address } from 'viem';


export function useSymbol(tokenAddress: Address) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
  });
}