'use client';

import { useState, useEffect } from 'react';
import { useAppChainId } from '../context/hooks';

const defaultMissingImage = '@/lib/network/utils';
export const useFetchLocalLogo = (tokenAddress: string): string => {
  const chainId = useAppChainId();
  const [logoSrc, setLogoSrc] = useState<string>(defaultMissingImage);

  useEffect(() => {
    if (!tokenAddress || !chainId) return;

    const logoURL = `assets/blockchains/${chainId}/contracts/${tokenAddress}/logo.png`;
    console.log(`✅ logoURL = ${logoURL}`);

    fetch(logoURL)
      .then((res) => {
        if (res.ok) {
          setLogoSrc(logoURL);
        } else {
          setLogoSrc(defaultMissingImage);
        }
      })
      .catch(() => {
        setLogoSrc(defaultMissingImage);
      });
  }, [tokenAddress, chainId]);

  return logoSrc;
};
