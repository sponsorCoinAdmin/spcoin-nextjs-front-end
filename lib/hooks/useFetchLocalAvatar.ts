'use client';

import { useEffect, useState } from 'react';
import { InputState } from '@/lib/structure/types';
import { useChainId } from 'wagmi';

const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';


export const useFetchLocalAvatar = (tokenAddress: string) => {
  const chainId = useChainId();

  const avatarURL = `assets/blockchains/${chainId}/contracts/${tokenAddress}/avatar.png`;
  const [avatarSrc, setAvatarSrc] = useState<string>(defaultMissingImage);

  console.log(`✅✅✅✅✅avatarURL = ${avatarURL}`)
    fetch(avatarURL)
      .then((res) => {
        if (res.ok) {
          setAvatarSrc(avatarURL);
        } else {
          setAvatarSrc(defaultMissingImage);
        }
      })
      .catch(() => {
        setAvatarSrc(defaultMissingImage);
      });
  }, [inputState, avatarURL]);

  return avatarSrc;
};
