'use client';

import { useMemo } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useMappedTokenContract } from '@/lib/context/hooks';
import { isAddress } from 'viem';

export function useDebouncedAddress(selectAddress: string | undefined, delay = 250): string {
  return useDebounce(selectAddress || '', delay);
}

export function useResolvedAsset(debouncedAddress: string) {
  const isValid = isAddress(debouncedAddress);

  const tokenAddress = useMemo(() => {
    return isValid ? (debouncedAddress as `0x${string}`) : undefined;
  }, [debouncedAddress, isValid]);

  const resolved = useMappedTokenContract(tokenAddress);

  const isResolved = !!resolved;
  const isLoading = isValid && resolved === undefined;

  return useMemo(() => {
    return {
      resolvedAsset: resolved,
      isResolved,
      isLoading,
    };
  }, [resolved, isResolved, isLoading]);
}
