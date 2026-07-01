'use client';

import { useCallback } from 'react';
import { Wallet, JsonRpcProvider, Contract } from 'ethers';
import { erc20Abi } from 'viem';
import type { Address } from 'viem';
import { useWriteContract } from 'wagmi';
import { useExchangeContext } from '@/lib/context/hooks';

const HARDHAT_CHAIN_ID = 31337;

const ERC20_TRANSFER_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];

let cachedTestAccounts: { address: string; privateKey?: string }[] | null = null;

async function loadTestAccounts(): Promise<{ address: string; privateKey?: string }[]> {
  if (cachedTestAccounts) return cachedTestAccounts;
  try {
    const res = await fetch(`/assets/spCoinLab/networks/${HARDHAT_CHAIN_ID}/testAccounts.json`, { cache: 'no-store' });
    if (!res.ok) return [];
    const raw = (await res.json()) as Array<string | { address?: unknown; privateKey?: unknown }>;
    cachedTestAccounts = raw
      .map((entry) =>
        typeof entry === 'string'
          ? { address: entry }
          : { address: String(entry?.address ?? '').trim(), privateKey: String(entry?.privateKey ?? '').trim() || undefined },
      )
      .filter((e) => /^0x[a-fA-F0-9]{40}$/i.test(e.address));
    return cachedTestAccounts;
  } catch {
    return [];
  }
}

export function useHardhatAwareTransfer() {
  const { exchangeContext } = useExchangeContext();
  const { writeContractAsync } = useWriteContract();

  const transfer = useCallback(
    async (tokenAddress: Address, recipient: Address, amount: bigint) => {
      const chainId = Number(exchangeContext?.network?.chainId);
      const rpcUrl = String(exchangeContext?.network?.rpcUrl ?? '').trim();
      const activeAddress = String(exchangeContext?.accounts?.activeAccount?.address ?? '').toLowerCase();

      if (chainId === HARDHAT_CHAIN_ID && rpcUrl && activeAddress) {
        const accounts = await loadTestAccounts();
        const account = accounts.find((a) => a.address.toLowerCase() === activeAddress);
        if (account?.privateKey) {
          const provider = new JsonRpcProvider(rpcUrl, HARDHAT_CHAIN_ID);
          try {
            const signer = new Wallet(account.privateKey, provider);
            const contract = new Contract(tokenAddress, ERC20_TRANSFER_ABI, signer);
            const tx = await contract.transfer(recipient, amount);
            await tx.wait();
            return tx.hash as string;
          } finally {
            provider.destroy();
          }
        }
      }

      return writeContractAsync({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'transfer',
        args: [recipient, amount],
      });
    },
    [exchangeContext, writeContractAsync],
  );

  const sendNative = useCallback(
    async (recipient: Address, amount: bigint) => {
      const chainId = Number(exchangeContext?.network?.chainId);
      const rpcUrl = String(exchangeContext?.network?.rpcUrl ?? '').trim();
      const activeAddress = String(exchangeContext?.accounts?.activeAccount?.address ?? '').toLowerCase();

      if (chainId === HARDHAT_CHAIN_ID && rpcUrl && activeAddress) {
        const accounts = await loadTestAccounts();
        const account = accounts.find((a) => a.address.toLowerCase() === activeAddress);
        if (account?.privateKey) {
          const provider = new JsonRpcProvider(rpcUrl, HARDHAT_CHAIN_ID);
          try {
            const signer = new Wallet(account.privateKey, provider);
            const tx = await signer.sendTransaction({ to: recipient, value: amount });
            await tx.wait();
            return tx.hash;
          } finally {
            provider.destroy();
          }
        }
      }

      return undefined;
    },
    [exchangeContext],
  );

  return { transfer, sendNative };
}
