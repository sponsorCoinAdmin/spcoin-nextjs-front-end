'use client';

import React, { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';

import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

interface ActiveAccountProps {
  account?: spCoinAccount;
  accountType?: string;
  showTitle?: boolean;
}

export default function ActiveAccount({ account, accountType = 'Account', showTitle = true }: ActiveAccountProps) {
  const { openPanel, closePanel } = usePanelTree();
  const walletAccountsVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const [copied, setCopied] = useState(false);
  const address = String(account?.address ?? '').trim();

  if (!address) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleChevronClick = () => {
    if (walletAccountsVisible) {
      closePanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'ActiveAccount:chevron:close');
    } else {
      openPanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'ActiveAccount:chevron:open');
    }
  };

  return (
    <div className="shrink-0 border-b border-slate-700/50 px-5 py-2 flex items-center gap-2 text-sm text-slate-300/80">
      {account?.logoURL ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
          <img
            src={account.logoURL}
            alt={account.name || 'Account logo'}
            className="h-full w-full object-contain"
          />
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {showTitle && (
          <span className="text-center text-[15px] font-semibold text-[#5981F3]">
            {accountType}{account.name ? ` ${account.name}` : ''}
          </span>
        )}
        <div className="flex w-full items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[22px] bg-[#243056] px-1 py-1 text-[15px] text-[#5981F3]">
            <span className="w-full truncate whitespace-nowrap text-center font-mono">{address}</span>
            <button
              type="button"
              onClick={handleChevronClick}
              className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 p-0.5"
              aria-label={walletAccountsVisible ? 'Hide accounts' : 'Show accounts'}
            >
              <ChevronDown
                className={[
                  'h-4 w-4 text-slate-400 transition-transform duration-200',
                  walletAccountsVisible ? 'rotate-180' : '',
                ].join(' ')}
              />
            </button>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 p-0.5"
            aria-label="Copy address"
            title="Copy address"
          >
            {copied
              ? <Check className="h-6 w-6 text-green-400" />
              : <Copy className="h-6 w-6 text-slate-400" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
