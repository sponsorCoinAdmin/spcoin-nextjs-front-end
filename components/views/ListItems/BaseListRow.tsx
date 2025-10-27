// File: components/views/ListItems/BaseListRow.tsx
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import info_png from '@/public/assets/miscellaneous/info1.png';
import { defaultMissingImage } from '@/lib/network/utils';

type BaseListRowProps = {
  avatarSrc: string;
  title: string;
  subtitle?: string;
  onAvatarClick: () => void;               // mandatory
  onInfoClick?: () => void;
  onInfoContextMenu?: () => void;
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
  className,
  titleClassName = 'font-semibold truncate text-[#5981F3]',
  subtitleClassName = 'text-sm truncate',  // ← no color hard-coding
}: BaseListRowProps) {
  return (
    <div className={`w-full flex justify-between mb-1 pt-2 px-5 hover:bg-spCoin_Blue-900 ${className ?? ''}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0"
          onClick={onAvatarClick}
          aria-label={`${title} logo action`}
          title={`${title} logo`}
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
        className="relative top-2.5 py-3 rounded w-8 h-0 flex items-center justify-center"
        onClick={(e) => { e.stopPropagation(); onInfoClick?.(); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onInfoContextMenu?.(); }}
        aria-label="Info"
        title="Info"
      >
        <Image src={info_png} alt="Info" width={20} height={20} />
      </button>
    </div>
  );
}

export default memo(BaseListRow);
