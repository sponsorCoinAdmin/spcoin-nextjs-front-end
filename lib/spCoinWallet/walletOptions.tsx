'use client';

import React from 'react';
import Image, { type StaticImageData } from 'next/image';
import {
  ArrowLeftRight,
  FolderCog,
  HandHeart,
  UserRoundPlus,
} from 'lucide-react';
import cog_png from '@/public/assets/miscellaneous/cog.png';

interface WalletOption {
  label: string;
  icon:
    | { type: 'component'; value: React.ComponentType<{ className?: string }> }
    | { type: 'image'; value: StaticImageData };
}

interface WalletOptionsProps {
  onSelectOption?: (label: string) => void;
}

const WALLET_OPTIONS: WalletOption[] = [
  { label: 'Manage Account', icon: { type: 'component', value: UserRoundPlus } },
  { label: 'Manage Rewards', icon: { type: 'component', value: FolderCog } },
  { label: 'Swap Tokens', icon: { type: 'component', value: ArrowLeftRight } },
  { label: 'Sponsor Recipient', icon: { type: 'component', value: HandHeart } },
  { label: 'Config', icon: { type: 'image', value: cog_png } },
];

export default function WalletOptions({ onSelectOption }: WalletOptionsProps) {
  return (
    <div className="min-h-0 flex-1 border-t border-slate-700/70 px-9 py-8">
      <div className="grid grid-cols-2 items-stretch gap-5 sm:grid-cols-3 lg:grid-cols-5">
        {WALLET_OPTIONS.map(({ label, icon }) => {
          const Icon = icon.type === 'component' ? icon.value : null;

          return (
          <button
            key={label}
            type="button"
            onClick={() => onSelectOption?.(label)}
            className={[
              'flex min-h-[176px] flex-col items-center justify-center gap-5',
              'rounded-[18px] border border-slate-800 bg-[#161922] px-3 py-5 text-white',
              'transition-colors hover:bg-[#1b2130] hover:border-slate-700',
            ].join(' ')}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#1f2431] text-slate-200">
              {Icon ? (
                <Icon className="h-8 w-8" />
              ) : (
                <Image
                  src={icon.value as StaticImageData}
                  width={32}
                  height={32}
                  alt="Config"
                  className="h-8 w-8 object-contain"
                />
              )}
            </span>
            <span className="max-w-full text-center text-[1rem] font-semibold leading-6">
              {label}
            </span>
          </button>
          );
        })}
      </div>
    </div>
  );
}
