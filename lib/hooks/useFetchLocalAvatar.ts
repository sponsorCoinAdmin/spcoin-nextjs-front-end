'use client';

import { useEffect, useState } from 'react';
import { InputState } from '@/lib/structure/types';

const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';

export const useFetchLocalAvatar = (inputState: InputState, avatarURL: string) => {
  const [avatarSrc, setAvatarSrc] = useState<string>(defaultMissingImage);

  useEffect(() => {
    if (inputState !== InputState.VALID_INPUT_PENDING || !avatarURL) {
      setAvatarSrc(defaultMissingImage);
      return;
    }

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
