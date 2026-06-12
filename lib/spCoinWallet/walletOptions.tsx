'use client';

import React from 'react';
import {
  ArrowLeftRight,
  FolderCog,
  HandHeart,
  UserRoundPlus,
} from 'lucide-react';

type WalletOption = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type WalletOptionsProps = {
  onSelectOption?: (label: string) => void;
};

const WALLET_OPTIONS: WalletOption[] = [
  { label: 'Register Account', icon: UserRoundPlus },
  { label: 'Manage Account', icon: FolderCog },
  { label: 'Swap Tokens', icon: ArrowLeftRight },
  { label: 'Sponsor Recipient', icon: HandHeart },
];

export default function WalletOptions({ onSelectOption }: WalletOptionsProps) {
  return (
    <div className="min-h-0 flex-1 border-t border-slate-700/70 px-9 py-8">
      <div className="flex items-stretch gap-5">
        {WALLET_OPTIONS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSelectOption?.(label)}
            className={[
              'flex min-h-[176px] flex-1 flex-col items-center justify-center gap-5',
              'rounded-[18px] border border-slate-800 bg-[#161922] px-3 py-5 text-white',
              'transition-colors hover:bg-[#1b2130] hover:border-slate-700',
            ].join(' ')}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#1f2431] text-slate-200">
              <Icon className="h-8 w-8" />
            </span>
            <span className="max-w-full text-center text-[1rem] font-semibold leading-6">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
