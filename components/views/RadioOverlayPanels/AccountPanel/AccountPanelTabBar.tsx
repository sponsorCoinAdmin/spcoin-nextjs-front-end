'use client';

import { ArrowLeftRight, FolderCog, Settings2, UserRoundPlus } from 'lucide-react';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';

const TABS = [
  { key: 'ACCOUNT' as const, label: 'Account', icon: UserRoundPlus, panel: SP_COIN_DISPLAY.ACCOUNT_PANEL },
  { key: 'REWARDS' as const, label: 'Rewards', icon: FolderCog,      panel: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL },
  { key: 'SWAP'    as const, label: 'Swap',    icon: ArrowLeftRight,  panel: SP_COIN_DISPLAY.TRADING_STATION_PANEL },
  { key: 'OPTIONS' as const, label: 'Options', icon: Settings2,       panel: SP_COIN_DISPLAY.WALLET_CONFIG_PANEL },
] as const;

type Props = { open?: boolean };

export default function AccountPanelTabBar({ open = true }: Props) {
  const { openPanel } = usePanelTree();
  const swapVisible    = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const rewardsVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const optionsVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL);

  const activeKey = swapVisible ? 'SWAP' : rewardsVisible ? 'REWARDS' : optionsVisible ? 'OPTIONS' : 'ACCOUNT';

  return (
    <div
      className="shrink-0 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
      style={{ maxHeight: open ? '80px' : '0px', opacity: open ? 1 : 0 }}
    >
      <div className="border-b border-slate-700/70 px-4 pt-3">
        <div className="scrollbar-hide flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const isActive = tab.key === activeKey;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => openPanel(tab.panel, `AccountPanelTabBar:${tab.key}`)}
                className={[
                  'inline-flex min-w-[92px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-t-[12px] border px-4 py-2 text-[0.72rem] font-semibold tracking-[0.14em] transition-colors',
                  isActive
                    ? 'border-[#596fe8] bg-[#243056] text-[#9db0ff]'
                    : 'border-slate-700/70 bg-[#11162a] text-slate-300 hover:border-slate-600 hover:bg-[#1a2034]',
                ].join(' ')}
                aria-pressed={isActive}
                title={tab.label}
              >
                {tab.key === 'OPTIONS' ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
