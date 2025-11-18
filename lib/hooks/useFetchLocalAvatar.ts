// File: lib/hooks/useFetchLocalLogo.ts
'use client';

import { useEffect, useState } from 'react';
import { defaultMissingImage, getLogoURL } from '@/lib/context/helpers/assetHelpers';
import { FEED_TYPE } from '@/lib/structure';
import { useAppChainId } from '@/lib/context/hooks'; // returns [chainId, setChainId]

/**
 * Resolve a local contract logo using the central assetHelpers logo resolver.
 * This delegates path construction + existence checks to getLogoURL.
 */
export const useFetchLocalLogo = (tokenAddress: string): string => {
  const [chainId] = useAppChainId();
  const [logoSrc, setLogoSrc] = useState<string>(defaultMissingImage);

  useEffect(() => {
    if (!tokenAddress || !chainId) return;

    // Avoid SSR fetch; assume missing until client runs.
    if (typeof window === 'undefined') {
      setLogoSrc(defaultMissingImage);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const url = await getLogoURL(chainId, tokenAddress as any, FEED_TYPE.TOKEN_LIST);
        if (!cancelled) {
          setLogoSrc(url);
        }
      } catch {
        if (!cancelled) {
          setLogoSrc(defaultMissingImage);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenAddress, chainId]);

  return logoSrc;
};
