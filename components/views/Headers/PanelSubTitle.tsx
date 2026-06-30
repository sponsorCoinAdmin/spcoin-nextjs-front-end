'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';
import AccountAvatar from '@/components/utility/AccountAvatar';
import RoleTableComponent from '@/components/shared/RoleTableComponent';
import { truncateMiddle } from '@/lib/utils/addressUtils';

export default function PanelSubTitle() {
  const { exchangeContext } = useExchangeContext();
  const { openPanel, closePanel } = usePanelTree();
  const [copied, setCopied] = useState(false);
  const walletAccountsVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const sendVisible    = usePanelVisible(SP_COIN_DISPLAY.SEND_PANEL);
  const rewardsVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const swapVisible    = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const sponsorVisible = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_PANEL);

  const text = sendVisible    ? 'Send'
    : rewardsVisible ? 'Manage Rewards'
    : swapVisible    ? 'Trading Station'
    : sponsorVisible ? 'Add New Sponsorship'
    : null;

  if (!text) return null;

  const activeAccount = exchangeContext?.accounts?.activeAccount;
  const address = String(activeAccount?.address ?? '').trim();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <PanelGate panel={SP_COIN_DISPLAY.PANEL_SUB_TITLE} lazyLoad={false}>
      <div className="relative shrink-0 select-none py-3 flex items-center">
        {/* Left: logo + address + chevron + copy */}
        <div className="flex items-center gap-1 text-sm font-mono text-slate-300">
          {activeAccount && (
            <AccountAvatar account={activeAccount} className="h-[38px] w-[38px] rounded object-contain" />
          )}
          {address && <span title={address}>{truncateMiddle(address, 4, 4)}</span>}
          <button
            type="button"
            onClick={() => walletAccountsVisible
              ? closePanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'PanelSubTitle:chevron:close')
              : openPanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'PanelSubTitle:chevron:open')
            }
            className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 p-0.5"
            aria-label={walletAccountsVisible ? 'Hide accounts' : 'Show accounts'}
          >
            {walletAccountsVisible
              ? <ChevronUp className="h-5 w-5 opacity-75" />
              : <ChevronDown className="h-5 w-5 opacity-75" />
            }
          </button>
          {address && (
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 p-0.5"
              aria-label="Copy address"
              title="Copy address"
            >
              {copied
                ? <Check className="h-4 w-4 text-green-400" />
                : <Copy className="h-4 w-4 text-slate-200" />
              }
            </button>
          )}
        </div>
        {/* Center: title */}
        <h2 className="absolute inset-x-0 m-0 text-center text-xl font-extrabold leading-tight tracking-wide text-white md:text-2xl pointer-events-none">
          {text}
        </h2>
        {/* Right: S/R/A roles */}
        <div className="ml-auto mr-[6px]">
          <RoleTableComponent account={activeAccount} />
        </div>
      </div>
    </PanelGate>
  );
}
