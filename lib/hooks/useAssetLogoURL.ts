// File: lib/hooks/useAssetLogoURL.ts
'use client';

import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { isAddress } from 'viem';
import { defaultMissingImage } from '@/lib/network/utils';

const seenBrokenLogos = new Set<string>();

export function markLogoAsBroken(address?: string) {
  if (address) seenBrokenLogos.add(address);
}

export function useAssetLogoURL(
  address: string,
  type: 'wallet' | 'token',
  fallbackURL?: string
): string {
  const chainId = useChainId();

  return useMemo(() => {
    if (!address || !isAddress(address)) return fallbackURL || defaultMissingImage;
    if (seenBrokenLogos.has(address)) return fallbackURL || defaultMissingImage;
    if (!chainId) return fallbackURL || defaultMissingImage;

    if (type === 'token') {
      return `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
    }

    // type === 'wallet'
    return `/assets/accounts/${address}/avatar.png`;
  }, [address, chainId, fallbackURL, type]);
}
