// File: lib/hooks/useAssetLogoURL.ts

'use client';

import { useMemo } from 'react';
import { isAddress } from 'viem';
import {
  defaultMissingImage,
  getAssetLogoURL,
} from '@/lib/context/helpers/assetHelpers';
import { FEED_TYPE } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useAppChainId } from '../context/hooks';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_USE_ASSET_LOGO_URL === 'true';
const debugLog = createDebugLogger('useAssetLogoURL', DEBUG_ENABLED, LOG_TIME);

const seenBrokenLogos = new Set<string>();

/**
 * Returns a logo URL based on the given address and type.
 * Falls back to a default image if the address is invalid or has been seen to fail.
 *
 * NOTE:
 * - Directory layout is centralized in `assetHelpers.getAssetLogoURL`.
 * - This hook just chooses the appropriate FEED_TYPE and delegates path building.
 */
export function useAssetLogoURL(
  address: string,
  type: 'wallet' | 'token',
  fallbackURL: string = defaultMissingImage,
): string {
  // useAppChainId returns a tuple [chainId, setChainId]
  const [chainId] = useAppChainId();

  return useMemo(() => {
    if (!address || !isAddress(address)) return fallbackURL;
    if (!chainId) return fallbackURL;

    // If we've already seen this address produce a broken logo, short-circuit.
    if (seenBrokenLogos.has(address)) return fallbackURL;

    const feedType =
      type === 'wallet' ? FEED_TYPE.RECIPIENT_ACCOUNTS : FEED_TYPE.TOKEN_LIST;

    const logoURL = getAssetLogoURL(address, chainId, feedType) || fallbackURL;

    debugLog.log?.(`✅ logoURL (${type}) = ${logoURL}`);
    return logoURL;
  }, [address, type, chainId, fallbackURL]);
}

export function markLogoAsBroken(address: string) {
  seenBrokenLogos.add(address);
}
