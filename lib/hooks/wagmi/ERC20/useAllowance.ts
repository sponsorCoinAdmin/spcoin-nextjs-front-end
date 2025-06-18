// File: lib/erc20/useERC20Allowance.ts
'use client';

import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { Address } from 'viem';

export function useAllowance(tokenAddress: Address, owner: Address, spender: Address) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, spender],
  });
}