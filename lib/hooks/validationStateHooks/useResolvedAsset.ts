// File: lib/hooks/validationStateHooks/useResolvedAsset.ts
'use client';

import { useMemo } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useMappedTokenContract } from '@/lib/context/hooks';
import { FEED_TYPE } from '@/lib/structure';
import { isAddress } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useMappedWalletAccount } from './useMappedWalletAccount';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('useResolvedAsset', DEBUG_ENABLED, LOG_TIME);

export function useDebouncedAddress(selectAddress: string | undefined, delay = 250): string {
  return useDebounce(selectAddress || '', delay);
}

export function useResolvedAsset(debouncedAddress: string, feedType: FEED_TYPE) {
  const isValid = isAddress(debouncedAddress);
  const validAddress = isValid ? (debouncedAddress as `0x${string}`) : undefined;

  // ✅ Call all hooks unconditionally, but control their activation with parameters
  const tokenContract = useMappedTokenContract(feedType === FEED_TYPE.TOKEN_LIST ? validAddress : undefined);
  const walletAccount = useMappedWalletAccount(
    feedType === FEED_TYPE.RECIPIENT_ACCOUNTS|| feedType === FEED_TYPE.AGENT_ACCOUNTS ? validAddress : undefined
  );

  const resolved = feedType === FEED_TYPE.TOKEN_LIST ? tokenContract : walletAccount;
  const isResolved = !!resolved;
  const isLoading = isValid && resolved === undefined;

  debugLog.log(`🧩 useResolvedAsset() → debounced: ${debouncedAddress}, valid: ${isValid}`);
  debugLog.log(`🔄 resolvedAsset:`, resolved);

  return {
    resolvedAsset: resolved,
    isResolved,
    isLoading,
  };
}
