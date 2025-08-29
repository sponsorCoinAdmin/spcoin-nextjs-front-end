// File: lib/hooks/useAssetLogoURL.ts

'use client';

import { useMemo } from 'react';
import { useAppChainId } from 'wagmi';
import { isAddress } from 'viem';
import { defaultMissingImage } from '@/lib/context/helpers/NetworkHelpers';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_ASSET_LOGO_URL === 'true';
const debugLog = createDebugLogger('useAssetLogoURL', DEBUG_ENABLED, LOG_TIME);

const seenBrokenLogos = new Set<string>();

/**
 * Returns a logo URL based on the given address and type.
 * Falls back to a default image if the address is invalid or has been seen to fail.
 */
export function useAssetLogoURL(
  address: string,
  type: 'wallet' | 'token',
  fallbackURL: string = defaultMissingImage
): string {
  const chainId = useAppChainId();

  return useMemo(() => {
    if (!address || !isAddress(address)) return fallbackURL;
    if (!chainId) return fallbackURL;
    if (seenBrokenLogos.has(address)) return fallbackURL;

    const logoURL =
      type === 'wallet'
        ? `/assets/wallets/${address}/avatar.png`
        : `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;

    debugLog.log(`✅ logoURL (${type}) = ${logoURL}`);
    return logoURL;
  }, [address, type, chainId]);
}

export function markLogoAsBroken(address: string) {
  seenBrokenLogos.add(address);
}
