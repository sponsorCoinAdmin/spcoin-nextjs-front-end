'use client';

import { useWriteContract } from 'wagmi';
import type { Address } from 'viem';
import { erc20Abi  } from 'viem';


export function useApprove() {
  const { writeContract, ...rest } = useWriteContract();

  const approve = (tokenAddress: Address, spender: Address, amount: bigint) =>
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amount],
    });

  return { approve, ...rest };
}
