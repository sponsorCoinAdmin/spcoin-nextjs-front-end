'use client';

import { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';

const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';

export const useFetchLocalLogo = (tokenAddress: string): string => {
  const chainId = useChainId();
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
