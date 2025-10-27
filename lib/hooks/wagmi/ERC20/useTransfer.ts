'use client';

import { useWriteContract } from 'wagmi';
import type { Address } from 'viem';
import { erc20Abi } from 'viem';

export function useTransfer() {
  const { writeContractAsync, ...rest } = useWriteContract();

  async function transfer(tokenAddress: Address, recipient: Address, amount: bigint) {
    return writeContractAsync({
      abi: erc20Abi,
      address: tokenAddress,
      functionName: 'transfer',
      args: [recipient, amount],
    });
  }

  return { transfer, ...rest };
}
