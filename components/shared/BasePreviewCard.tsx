// File: @/components/shared/utils/sharedPreviews/BasePreviewCard.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import styles from '@/styles/Modal.module.css';
import info_png from '@/public/assets/miscellaneous/info.png';

type Props = {
  name: string;
  symbol: string;
  logoSrc: string;
  onSelect: () => void;
  onInfoClick?: () => void;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  width?: number;
  height?: number;
};

const BasePreviewCard: React.FC<Props> = ({
  name,
  symbol,
  logoSrc,
  onSelect,
  onInfoClick,
  onContextMenu,
  onError,
  width = 32,
  height = 32,
}) => {
  return (
    <div
      className="w-full flex items-center justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900"
      onContextMenu={onContextMenu}
    >
      {/* Left block: token logo + name/symbol */}
      <div className="cursor-pointer flex items-center gap-3 min-w-0" onClick={onSelect}>
        <Image
          src={logoSrc}
          alt={`${name} logo`}
          width={width}
          height={height}
          className={styles.elementLogo}
          onError={onError}
        />
        <div className="min-w-0">
          <div className={`${styles.elementName} truncate`}>{name || 'Unknown'}</div>
          <div className={`${styles.elementSymbol} truncate`}>{symbol || 'N/A'}</div>
        </div>
      </div>

      <div
        className="ml-auto flex items-center justify-center cursor-pointer rounded w-8 h-8 text-lg font-bold text-white flex-none"
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
