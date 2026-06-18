'use client';

import { useEffect, useRef } from 'react';
import { ArrowLeftRight, FolderCog, Settings2, UserRoundPlus } from 'lucide-react';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';

const TABS = [
  { key: 'ACCOUNT' as const, label: 'Account', icon: UserRoundPlus, panel: SP_COIN_DISPLAY.ACCOUNT_PANEL },
  { key: 'REWARDS' as const, label: 'Rewards', icon: FolderCog,      panel: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL },
  { key: 'SWAP'    as const, label: 'Swap',    icon: ArrowLeftRight,  panel: SP_COIN_DISPLAY.TRADING_STATION_PANEL },
  { key: 'CONFIG'  as const, label: 'Config',  icon: Settings2,       panel: SP_COIN_DISPLAY.WALLET_CONFIG_PANEL },
] as const;

type TabKey = typeof TABS[number]['key'];
type Props = { open?: boolean };

export default function AccountPanelTabBar({ open = true }: Props) {
  const { openPanel } = usePanelTree();
  const swapVisible         = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const rewardsVisible      = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const optionsVisible      = usePanelVisible(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL);
  const accountPanelVisible = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL);
  const wacVisible          = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const wncVisible          = usePanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT);

  const isOverlayOpen = wacVisible || wncVisible;
  const derivedKey: TabKey = swapVisible ? 'SWAP' : rewardsVisible ? 'REWARDS' : optionsVisible ? 'CONFIG' : 'ACCOUNT';

  // Remembers the active tab before an overlay opened so we can freeze the indicator and restore on close.
  const lastTabKey      = useRef<TabKey>(derivedKey);
  const prevOverlayOpen = useRef(false);

  useEffect(() => {
    const wasOpen = prevOverlayOpen.current;
    prevOverlayOpen.current = isOverlayOpen;

    if (wasOpen && !isOverlayOpen) {
      // Overlay just closed — restore the previous tab if no tab became active via an explicit click.
      const anyTabActive = swapVisible || rewardsVisible || optionsVisible || accountPanelVisible;
      if (!anyTabActive) {
        const tab = TABS.find(t => t.key === lastTabKey.current);
        if (tab) openPanel(tab.panel, 'AccountPanelTabBar:restore-after-overlay');
      }
      // lastTabKey.current is intentionally NOT updated here; it will sync on the next render
      // once the restored tab panel becomes visible (handled by the else-if branch below).
    } else if (!isOverlayOpen) {
      // Steady state — keep the remembered key in sync with the actually active tab.
      lastTabKey.current = derivedKey;
    }
  }, [isOverlayOpen, derivedKey, swapVisible, rewardsVisible, optionsVisible, accountPanelVisible, openPanel]);

  // While an overlay is open, freeze the visual indicator on the last remembered tab.
  const activeKey: TabKey = isOverlayOpen ? lastTabKey.current : derivedKey;

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
                    'inline-flex min-w-[92px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-t-[12px] border px-4 py-2 text-[0.72rem] font-semibold tracking-[0.14em] transition-colors',
                    isActive
                      ? 'border-[#596fe8] bg-[#243056] text-[#9db0ff]'
                      : 'border-slate-700/70 bg-[#11162a] text-slate-300 hover:border-slate-600 hover:bg-[#1a2034]',
                  ].join(' ')}
                  aria-pressed={isActive}
                  title={tab.label}
                >
                  {tab.key === 'CONFIG' && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
