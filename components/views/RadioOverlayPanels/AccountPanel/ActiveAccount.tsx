'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import AccountAvatar from '@/components/utility/AccountAvatar';
import { truncateMiddle } from '@/lib/utils/addressUtils';

interface ActiveAccountProps {
  account?: spCoinAccount;
  accountType?: string;
  showTitle?: boolean;
}

export default function ActiveAccount({ account, accountType = 'Account', showTitle = true }: ActiveAccountProps) {
  const { openPanel, closePanel, setPanelVisible } = usePanelTree();
  const walletAccountsVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const activeAccountHeaderVisible = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_ACCOUNT_HEADER_BAR);
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
    <div className="shrink-0 border-b border-slate-700/50 -mx-4 px-4 pb-2 flex items-center gap-2 text-sm text-slate-300/80">
      {account?.logoURL ? (
        <div className="flex h-8 w-8 shrink-0 -ml-[2px] items-center justify-center overflow-hidden rounded-lg hover:opacity-80 transition-opacity">
          <AccountAvatar
            account={account}
            className="h-full w-full object-contain"
          />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {showTitle && (
          <span className="text-center text-[15px] font-semibold text-[#5981F3]">
            {accountType}{account?.name ? ` ${account.name}` : ''}
          </span>
        )}
        <div className="flex w-full items-center gap-[2px]">
          <div className="flex h-[25px] items-center gap-[5px] rounded-full pl-0 pr-3 text-slate-200 font-bold">
            <span
              className="whitespace-nowrap font-mono cursor-pointer text-[17px]"
              title={address}
              onClick={() => setPanelVisible(SP_COIN_DISPLAY.ACTIVE_ACCOUNT_HEADER_BAR, !activeAccountHeaderVisible)}
            >{truncateMiddle(address, 4, 4)}</span>
            <button
              type="button"
              onClick={handleChevronClick}
              className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 p-0.5"
              aria-label={walletAccountsVisible ? 'Hide accounts' : 'Show accounts'}
            >
              {walletAccountsVisible
                ? <ChevronUp className="h-5 w-5 opacity-75" />
                : <ChevronDown className="h-5 w-5 opacity-75" />
              }
            </button>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 pl-0.5 pr-0"
            aria-label="Copy address"
            title="Copy address"
          >
            {copied
              ? <Check className="h-6 w-6 text-green-400" />
              : <Copy className="h-5 w-5 text-slate-200" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
