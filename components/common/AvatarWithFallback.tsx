'use client';

import Image, { ImageProps } from 'next/image';
import React, { useEffect, useState } from 'react';
import { InputState, getInputStateString } from '@/lib/structure/types';

interface AvatarWithFallbackProps extends ImageProps {
  fallbackSrc: string;
  inputState?: InputState;
}

const failedImageCache = new Set<string>();

const AvatarWithFallback: React.FC<AvatarWithFallbackProps> = ({
  src,
  fallbackSrc,
  inputState,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src as string);

  useEffect(() => {
    if (inputState !== undefined) {
      console.debug(`[🖼️ AvatarWithFallback] inputState:`, getInputStateString(inputState));
    }
  }, [inputState]);

  useEffect(() => {
    const srcStr = src as string;
    if (failedImageCache.has(srcStr)) {
      console.debug(`[🖼️ AvatarWithFallback] Skipping known failed image:`, srcStr);
      setImgSrc(fallbackSrc);
    } else {
      setImgSrc(srcStr);
    }
  }, [src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={imgSrc}
      onError={(e) => {
        const failedSrc = e.currentTarget.src;
        console.warn(`[🖼️ AvatarWithFallback] onError: fallback to ${fallbackSrc}`);
        failedImageCache.add(failedSrc);
        setImgSrc(fallbackSrc);
      }}
    />
  );
};

export default AvatarWithFallback;
