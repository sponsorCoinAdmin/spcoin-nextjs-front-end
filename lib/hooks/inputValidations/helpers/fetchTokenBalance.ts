// File: lib/hooks/inputValidations/helpers/fetchTokenBalance.ts

import { PublicClient, erc20Abi, Address } from 'viem';
import { getValidationDebugLogger } from './debugLogInstance';

const log = getValidationDebugLogger('fetchTokenBalance');

/**
 * Fetch the on-chain token balance for a given account.
 * Handles both native and ERC-20 tokens.
 */
export async function fetchTokenBalance(
  tokenAddress: Address,
  accountAddress: Address,
  isNative: boolean,
  publicClient: PublicClient,
  chainId?: number,
  callerName?: string
): Promise<bigint> {
  try {
    log.log(`🔍 Fetching balance for: ${tokenAddress} (native=${isNative})`);
    log.log(`👤 Account: ${accountAddress}`);
    if (chainId) log.log(`🌐 Chain ID: ${chainId}`);
    if (callerName) log.log(`📛 Caller: ${callerName}`);

    if (isNative) {
      return await publicClient.getBalance({ address: accountAddress });
    }

    return await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [accountAddress],
    });
  } catch (err) {
    log.warn(`⚠️ Failed to fetch balance for ${tokenAddress}`, err);
    return 0n;
  }
}
