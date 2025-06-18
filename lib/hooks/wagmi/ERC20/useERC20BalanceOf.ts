// File: lib/erc20/useERC20BalanceOf.ts
'use client';

import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { Address } from 'viem';

export function useBalanceOf(tokenAddress: Address, account: Address) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account],
  });
}