'use client';

import { useEffect, useState } from 'react';
import { InputState } from '@/lib/structure';
import { useChainId } from 'wagmi';

const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';


export const useFetchLocalLogo = (tokenAddress: string) => {
  const chainId = useChainId();

  const logoURL = `assets/blockchains/${chainId}/contracts/${tokenAddress}/logo.png`;
  const [logoSrc, setLogoSrc] = useState<string>(defaultMissingImage);

  console.log(`✅✅✅✅✅logoURL = ${logoURL}`)
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
  }, [inputState, logoURL]);

  return logoSrc;
};
