// File: lib/wagmi/server/etERC20WagmiServerBalanceOfRec.ts
'use server';

import { readContract } from '@wagmi/core';
import { config } from '@/lib/wagmi/wagmiConfig';

import type { Address } from 'viem';
import { erc20Abi, getAddress } from 'viem';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

/** Read an ERC-20 balance using Wagmi v2 `readContract` (server-safe). */
export const getERC20WagmiServerBalanceOfRec = async (
  walletAddress?: Address | string,
  contractAddress?: Address | string
): Promise<bigint | null> => {
  if (!walletAddress || !contractAddress) return null;

  try {
    const wagmiBalanceOfRec = await readContract(config, {
      address: getAddress(contractAddress.toString()),
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [getAddress(walletAddress.toString())],
    });

    return wagmiBalanceOfRec as bigint;
  } catch (_err) {
    // eslint-disable-next-line no-console
    console.error('[getERC20WagmiServerBalanceOfRec] readContract failed:', _err);
    return null;
  }
};

/** Demo helper showing how to call the balance reader above. */
export const getTestName = async (): Promise<string> => {
  const ACTIVE_ACCOUNT_ADDRESS: Address = '0x858BDEe77B06F29A3113755F14Be4B23EE6D6e59';
  const USDT_POLYGON_CONTRACT: Address = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

  const balanceOf = await getERC20WagmiServerBalanceOfRec(
    ACTIVE_ACCOUNT_ADDRESS,
    USDT_POLYGON_CONTRACT
  );

  return balanceOf !== null
    ? `balanceOf = ${stringifyBigInt(balanceOf)}`
    : 'Failed to fetch balance';
};