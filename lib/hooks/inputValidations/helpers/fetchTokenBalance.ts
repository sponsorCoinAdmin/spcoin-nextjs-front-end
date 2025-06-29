// File: lib/hooks/inputValidations/helpers/fetchTokenBalance.ts

import { PublicClient, erc20Abi, Address } from 'viem';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('fetchTokenBalance', DEBUG_ENABLED);

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
    debugLog.log(`🔍 Fetching balance for: ${tokenAddress} (native=${isNative})`);
    debugLog.log(`👤 Account: ${accountAddress}`);
    if (chainId) debugLog.log(`🌐 Chain ID: ${chainId}`);
    if (callerName) debugLog.log(`📛 Caller: ${callerName}`);

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
    console.warn(`⚠️ Failed to fetch balance for ${tokenAddress}`, err);
    return 0n;
  }
}
