// File: @/components/views/ListItems/BaseListRow.tsx
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import checkGray from '@/public/assets/miscellaneous/check-gray.svg';
import checkGreen from '@/public/assets/miscellaneous/check-green.svg';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
type BaseListRowProps = {
  avatarSrc: string;
  title: string;
  subtitle?: string;
  onAvatarClick: () => void;               // mandatory
  onInfoClick?: () => void;
  onInfoContextMenu?: () => void;
  selectTitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;              // ← caller controls symbol style
};

function BaseListRow({
  avatarSrc,
  title,
  subtitle,
  onAvatarClick,
  onInfoClick,
  onInfoContextMenu,
  selectTitle,
  className,
  titleClassName = 'font-semibold truncate text-[#5981F3]',
  subtitleClassName = 'text-sm truncate',  // ← no color hard-coding
}: BaseListRowProps) {
  const selectLabel = selectTitle ?? 'Select';
  const metaLabel = `${subtitle || title} Meta Data`;
  return (
    <div
      className={`w-full min-h-[50px] max-h-[50px] flex items-center justify-between px-5 hover:bg-spCoin_Blue-900 ${className ?? ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); onInfoClick?.(); }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onInfoContextMenu?.(); }}
          aria-label={`${title} logo action`}
          title={metaLabel}
        >
          <img
            className="h-full w-full object-contain"
            src={avatarSrc}
            alt={`${title} logo`}
            onError={(e) => {
              // prevent error loop if fallback also fails
              e.currentTarget.onerror = null;
              e.currentTarget.src = defaultMissingImage;
            }}
          />
        </button>

        <div className="min-w-0">
          <div className={titleClassName}>{title}</div>
          {subtitle ? <div className={subtitleClassName}>{subtitle}</div> : null}
        </div>
      </div>

      <button
        type="button"
        className="rounded w-8 flex items-center justify-center group"
        onClick={onAvatarClick}
        aria-label="Select"
        title={selectLabel}
      >
        <span className="relative block h-[26px] w-[26px]">
          <Image
            src={checkGray}
            alt="Unchecked"
            width={26}
            height={26}
            className="absolute inset-0 opacity-100 transition-opacity group-hover:opacity-0"
          />
          <Image
            src={checkGreen}
            alt="Checked"
            width={26}
            height={26}
            className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </span>
      </button>
    </div>
  );
}

export default memo(BaseListRow);
