// File: lib/hooks/useAssetLogoURL.ts

'use client';

import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { isAddress } from 'viem';
import { InputState } from '@/lib/structure';
import { defaultMissingImage } from '@/lib/network/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useSharedPanelContext } from '../context/ScrollSelectPanels';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_USE_ASSET_LOGO_URL === 'true';
const debugLog = createDebugLogger('useAssetLogoURL', DEBUG_ENABLED, LOG_TIME);

const seenBrokenLogos = new Set<string>();

/**
 * Returns a logo URL based on the given address and type.
 * Falls back to a default image if the address is invalid, the logo has been seen to fail, or validation fails (for tokens).
 */
export function useAssetLogoURL(
  address: string,
  type: 'wallet' | 'token',
  fallbackURL: string = defaultMissingImage
): string {
  const chainId = useChainId();
  const { inputState, setInputState } = useSharedPanelContext();

  return useMemo(() => {
    if (!address || !isAddress(address)) return fallbackURL;
    if (!chainId) return fallbackURL;
    if (seenBrokenLogos.has(address)) return fallbackURL;
    if (type === 'token' && inputState === InputState.CONTRACT_NOT_FOUND_LOCALLY) return fallbackURL;

    const logoURL =
      type === 'wallet'
        ? `/assets/wallets/${address}/avatar.png`
        : `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;

    debugLog.log(`✅ logoURL (${type}) = ${logoURL}`);
    return logoURL;
  }, [address, type, chainId, inputState]);
}

export function markLogoAsBroken(address: string) {
  seenBrokenLogos.add(address);
}
