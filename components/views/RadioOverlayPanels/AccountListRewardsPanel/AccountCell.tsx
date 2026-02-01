// Dir: @/components/views/RadioOverlayPanels/AccountListRewardsPanel
'use client';

import React from 'react';
import Image from 'next/image';

import type { spCoinAccount } from '@/lib/structure';
import { DATALIST_IMG_PX, DATALIST_IMG_TW } from './constants';

export default function AccountCell({
  account,
  roleLabel,
  addressText,
  onPick,
  onRowEnter,
  onRowMove,
  onRowLeave,
}: {
  account: spCoinAccount;
  roleLabel: string;
  addressText: string;
  onPick: (a: spCoinAccount) => void;
  onRowEnter: (name?: string | null) => void;
  onRowMove: React.MouseEventHandler;
  onRowLeave: () => void;
}) {
  return (
    <div className="w-full flex items-center gap-2 min-w-0">
      <button
        type="button"
        className="bg-transparent p-0 m-0 hover:opacity-90 focus:outline-none"
        onMouseEnter={() => onRowEnter(account?.name ?? '')}
        onMouseMove={onRowMove}
        onMouseLeave={onRowLeave}
        onClick={() => onPick(account)}
        aria-label={`Open ${roleLabel}s reconfigure`}
        data-role={roleLabel}
        data-address={addressText}
      >
        <Image
          src={(account as any)?.logoURL || '/assets/miscellaneous/placeholder.png'}
          alt={`${account?.name ?? 'Wallet'} logo`}
          width={DATALIST_IMG_PX}
          height={DATALIST_IMG_PX}
          className={`${DATALIST_IMG_TW} object-contain rounded bg-transparent`}
        />
      </button>

      <div className="min-w-0 flex-1 flex flex-col items-start justify-center text-left">
        <div className="w-full font-semibold truncate !text-[#5981F3] text-left">{account?.name ?? 'Unknown'}</div>
        <div className="w-full text-sm truncate !text-[#5981F3] text-left">{(account as any)?.symbol ?? ''}</div>
      </div>
    </div>
  );
}
