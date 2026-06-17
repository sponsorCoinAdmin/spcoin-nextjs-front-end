'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

function formatShortAddress(addr: string) {
  const a = (addr ?? '').toString().trim();
  if (!a) return '';
  if (a.length <= 36) return ` ${a} `;
  return ` ${a.slice(0, 15)} ... ${a.slice(-15)} `;
}

function modeLabel(
  mode?: SP_COIN_DISPLAY.ACTIVE_ACCOUNT | SP_COIN_DISPLAY.SPONSOR_ACCOUNT | SP_COIN_DISPLAY.RECIPIENT_ACCOUNT | SP_COIN_DISPLAY.AGENT_ACCOUNT,
): string {
  if (mode === SP_COIN_DISPLAY.ACTIVE_ACCOUNT)    return 'Active Account:';
  if (mode === SP_COIN_DISPLAY.SPONSOR_ACCOUNT)   return 'Sponsor Account:';
  if (mode === SP_COIN_DISPLAY.RECIPIENT_ACCOUNT) return 'Recipient Account:';
  if (mode === SP_COIN_DISPLAY.AGENT_ACCOUNT)     return 'Agent Account:';
  return 'Account:';
}

interface ActiveAccountProps {
  account: spCoinAccount;
  mode?:
    | SP_COIN_DISPLAY.ACTIVE_ACCOUNT
    | SP_COIN_DISPLAY.SPONSOR_ACCOUNT
    | SP_COIN_DISPLAY.RECIPIENT_ACCOUNT
    | SP_COIN_DISPLAY.AGENT_ACCOUNT;
}

export default function ActiveAccount({ account, mode }: ActiveAccountProps) {
  const { openPanel } = usePanelTree();
  const walletAccountsVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);

  const address = formatShortAddress(String(account?.address ?? '').trim());
  if (!address) return null;

  const handleChevronClick = () => {
    if (walletAccountsVisible) {
      openPanel(SP_COIN_DISPLAY.ACCOUNT_PANEL, 'ActiveAccount:chevron:close');
    } else {
      openPanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'ActiveAccount:chevron:open');
    }
  };

  return (
    <div className="mb-[2px] flex items-center gap-2 text-sm text-slate-300/80">
      {account?.logoURL ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
          <img
            src={account.logoURL}
            alt={account.name || 'Account logo'}
            className="h-full w-full object-contain"
          />
        </span>
      ) : null}
      <span className="whitespace-nowrap">{modeLabel(mode)}</span>
      <div className="mb-0 flex w-full min-w-0 flex-1 items-center justify-center gap-2 rounded-[22px] bg-[#243056] px-1 py-1 text-sm text-[#5981F3]">
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
    </div>
  );
}
