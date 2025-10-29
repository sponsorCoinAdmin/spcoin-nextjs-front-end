// File: lib/hooks/useFetchLocalLogo.ts
'use client';

import { useEffect, useState } from 'react';
import { headOk } from '@/lib/rest/http';
import { defaultMissingImage } from '@/lib/network/utils';
import { useAppChainId } from '@/lib/context/hooks'; // returns [chainId, setChainId]

/**
 * Resolve a local contract logo (under /assets/blockchains/{chainId}/contracts/{addr}/logo.png)
 * using REST helpers (HEAD probe) with timeout + no-store caching.
 */
export const useFetchLocalLogo = (tokenAddress: string): string => {
  const [chainId] = useAppChainId();
  const [logoSrc, setLogoSrc] = useState<string>(defaultMissingImage);

  useEffect(() => {
    if (!tokenAddress || !chainId) return;
    // Avoid SSR get; assume missing until client runs.
    if (typeof window === 'undefined') {
      setLogoSrc(defaultMissingImage);
      return;
    }

    const logoURL = `/assets/blockchains/${chainId}/contracts/${tokenAddress}/logo.png`;

    let cancelled = false;
    (async () => {
      // First try a fast HEAD (many CDNs will return 405; headOk treats 2xx/3xx as pass)
      const ok = await headOk(logoURL, {
        timeoutMs: 3000,
        retries: 0,
        init: { cache: 'no-store' },
      });

      if (cancelled) return;

      // If HEAD said “ok” (or 3xx), use it; otherwise fall back to missing image.
      setLogoSrc(ok ? logoURL : defaultMissingImage);
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenAddress, chainId]);

  return logoSrc;
};
