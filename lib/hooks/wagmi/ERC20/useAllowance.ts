// File: lib/hooks/wagmi/ERC20/useAllowance.ts
'use client';

import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { erc20Abi  } from 'viem';


export function useAllowance(tokenAddress: Address, owner: Address, spender: Address) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, spender],
  });
}
