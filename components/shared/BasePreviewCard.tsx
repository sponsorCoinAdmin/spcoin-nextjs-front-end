'use client';

import React from 'react';
import Image from 'next/image';
import styles from '@/styles/Modal.module.css';
import info_png from '@/public/assets/miscellaneous/info1.png';

type Props = {
  name: string;
  symbol: string;
  avatarSrc: string;
  onSelect: () => void;
  onInfoClick?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  width?: number;
  height?: number;
};

const BasePreviewCard: React.FC<Props> = ({
  name,
  symbol,
  avatarSrc,
  onSelect,
  onInfoClick,
  onError,
  width = 40,
  height = 40,
}) => {
  return (
    <div className="flex flex-row justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900">
      <div className="cursor-pointer flex flex-row" onClick={onSelect}>
        <Image
          src={avatarSrc}
          alt={`${name} avatar`}
          width={width}
          height={height}
          className={styles.elementLogo}
          onError={onError}
        />
        <div>
          <div className={styles.elementName}>{name || 'Unknown'}</div>
          <div className={styles.elementSymbol}>{symbol || 'N/A'}</div>
        </div>
      </div>

      <div
        className="py-3 cursor-pointer rounded border-none w-8 h-8 text-lg font-bold text-white"
        onClick={(e) => {
          e.stopPropagation();
          if (onInfoClick) onInfoClick();
        }}
      >
        <Image src={info_png} className={styles.infoLogo} alt="Info" width={20} height={20} />
      </div>
    </div>
  );
};

export default BasePreviewCard;
