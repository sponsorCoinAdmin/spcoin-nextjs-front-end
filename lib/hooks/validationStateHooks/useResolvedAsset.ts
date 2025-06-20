'use client';

import { useMemo } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useMappedTokenContract } from '@/lib/context/hooks';
import { isAddress } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('useResolvedAsset', DEBUG_ENABLED, LOG_TIME);

export function useDebouncedAddress(selectAddress: string | undefined, delay = 250): string {
  return useDebounce(selectAddress || '', delay);
}

export function useResolvedAsset(debouncedAddress: string) {
  const isValid = isAddress(debouncedAddress);
  const tokenAddress = isValid ? (debouncedAddress as `0x${string}`) : undefined;

  const resolved = useMappedTokenContract(tokenAddress);
  const isResolved = !!resolved;
  const isLoading = isValid && resolved === undefined;

  debugLog.log(`🧩 useResolvedAsset() → debounced: ${debouncedAddress}, valid: ${isValid}`);
  debugLog.log(`🔄 resolved:`, resolved);

  return {
    resolvedAsset: resolved,
    isResolved,
    isLoading,
  };
}
