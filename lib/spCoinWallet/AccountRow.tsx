'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import type { SpCoinWalletAccount } from './types';

function sourceLabel(source: SpCoinWalletAccount['source']): string {
  if (source === 'hardhat') return 'Hardhat Wallet';
  if (source === 'metamask') return 'MetaMask';
  return 'Offline';
}

type AccountRowProps = {
  account: SpCoinWalletAccount;
  isActiveMarker?: boolean;
  isCollapsed?: boolean;
  fullBleed?: boolean;
  onTrace?: (message: string, data?: any) => void;
  onOpenAccountPanel?: () => void;
  onSelect?: () => void;
  onToggleCollapse?: () => void;
};

export default function AccountRow({
  account,
  isActiveMarker = false,
  isCollapsed = false,
  fullBleed = false,
  onTrace = () => {},
  onOpenAccountPanel = () => {},
  onSelect = () => {},
  onToggleCollapse = () => {},
}: AccountRowProps) {
  const [imageSrc, setImageSrc] = useState(account.logoURL || defaultMissingImage);
  const [imageFailed, setImageFailed] = useState(false);
  const meta = [account.label, account.symbol].filter(Boolean).join(' | ');

  useEffect(() => {
    setImageSrc(account.logoURL || defaultMissingImage);
    setImageFailed(false);
  }, [account.logoURL]);

  return (
    <div
      className={[
        'grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 py-2 text-left border-b border-slate-700/70 transition-colors hover:bg-slate-700/50',
        isActiveMarker ? 'bg-green-900/20' : '',
        fullBleed ? 'px-0' : 'px-4',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect();
        }}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]"
        title="Select account"
      >
        {!imageFailed ? (
          <img
            src={imageSrc}
            alt={account.name ?? account.label ?? 'Account'}
            className="h-full w-full object-contain"
            onError={() => {
              if (imageSrc !== defaultMissingImage) {
                setImageSrc(defaultMissingImage);
                return;
              }
              setImageFailed(true);
            }}
          />
        ) : (
          <Wallet className="h-5 w-5 text-[#7893ff]" />
        )}
      </button>
      <div className="min-w-0 bg-transparent">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="min-w-0 shrink rounded-none border-none bg-transparent px-0 py-0 text-left text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7893ff]"
          >
            <span className="block truncate text-sm font-semibold text-white">
              {meta || sourceLabel(account.source)}
            </span>
          </button>
          {isActiveMarker ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-400/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-200">
              Active
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onTrace('AccountRow chevron clicked', {
                    address: account.address,
                    label: account.label,
                    isCollapsed,
                    isActiveMarker,
                  });
                  onToggleCollapse();
                }}
                className="flex items-center justify-center rounded text-slate-200 transition-colors hover:text-white"
                aria-label={isCollapsed ? 'Show all accounts' : 'Hide other accounts'}
                title={isCollapsed ? 'Show all accounts' : 'Hide other accounts'}
              >
                {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>
            </span>
          ) : null}
        </div>
        <span className="block truncate font-mono text-[13px] text-slate-300">{account.address}</span>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onOpenAccountPanel();
        }}
        className="flex items-center justify-center self-center opacity-60 hover:opacity-100 transition-opacity"
        title="Open account details"
        aria-label="Open account details"
      >
        <img src="/assets/miscellaneous/info.png" alt="info" className="h-5 w-5" />
      </button>
    </div>
  );
}
