'use client';

import { useEffect, useRef } from 'react';
import { ArrowLeftRight, FolderCog, HeartHandshake, SendHorizonal } from 'lucide-react';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';

const TABS = [
  { key: 'SPONSOR' as const, label: 'Sponsor', icon: HeartHandshake, panel: SP_COIN_DISPLAY.SPONSOR_PANEL },
  { key: 'REWARDS' as const, label: 'Rewards', icon: FolderCog,      panel: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL },
  { key: 'SWAP'    as const, label: 'Swap',    icon: ArrowLeftRight,  panel: SP_COIN_DISPLAY.TRADING_STATION_PANEL },
  { key: 'SEND'    as const, label: 'Send',    icon: SendHorizonal,   panel: SP_COIN_DISPLAY.SEND_PANEL },
] as const;

type TabKey = typeof TABS[number]['key'];
type Props = { open?: boolean };

export default function AccountPanelTabBar({ open = true }: Props) {
  const { openPanel, closePanel } = usePanelTree();
  const sponsorVisible = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_PANEL);
  const rewardsVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const swapVisible    = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const sendVisible    = usePanelVisible(SP_COIN_DISPLAY.SEND_PANEL);
  const configVisible    = usePanelVisible(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL);
  const slippageVisible  = usePanelVisible(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL);
  const wacVisible          = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const wncVisible          = usePanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT);
  const accountPanelVisible = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL);

  const isOverlayOpen = wacVisible || wncVisible || accountPanelVisible;
  // Returns null (no tab active) when nothing is visible — config open or blank slate.
  const derivedKey: TabKey | null = sponsorVisible ? 'SPONSOR' : swapVisible ? 'SWAP' : sendVisible ? 'SEND' : rewardsVisible ? 'REWARDS' : null;

  const prevOverlayOpen  = useRef(false);
  const tabAtOverlayOpen = useRef<TabKey | null>(null);

  useEffect(() => {
    const wasOpen = prevOverlayOpen.current;
    prevOverlayOpen.current = isOverlayOpen;

    if (!wasOpen && isOverlayOpen) {
      // Overlay just opened — snapshot whichever tab was active at that moment.
      tabAtOverlayOpen.current = derivedKey;
    } else if (wasOpen && !isOverlayOpen) {
      // Overlay just closed — restore only the tab that was active when it opened.
      const target = tabAtOverlayOpen.current;
      tabAtOverlayOpen.current = null;
      if (target && !configVisible) {
        const tab = TABS.find(t => t.key === target);
        if (tab) openPanel(tab.panel, 'AccountPanelTabBar:restore-after-overlay');
      }
      // If target is null, no tab was active before the overlay — don't restore anything.
    }
  }, [isOverlayOpen, derivedKey, configVisible, openPanel]);

  // No tab is active while config is open or while an overlay (WAC/WNC) is covering the tabs.
  const activeKey: TabKey | null = configVisible ? null : isOverlayOpen ? tabAtOverlayOpen.current : derivedKey;

  const handleTabClick = (tab: typeof TABS[number]) => {
    // Config → tab: close config first so config is no longer highlighted.
    if (configVisible) closePanel(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL, `AccountPanelTabBar:closeConfigFor${tab.key}`);
    openPanel(tab.panel, `AccountPanelTabBar:${tab.key}`);
  };

  const handleSlippageConfigClick = () => {
    if (slippageVisible) {
      closePanel(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL, 'AccountPanelTabBar:Config:close');
    } else {
      openPanel(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL, 'AccountPanelTabBar:Config:open');
    }
  };

  return (
    <div
      className="shrink-0 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out -mx-4"
      style={{ maxHeight: open ? '80px' : '0px', opacity: open ? 1 : 0 }}
    >
      <div className="relative border-b border-slate-700/70 px-4 pt-3">
        <div className="scrollbar-hide flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const isActive = tab.key === activeKey;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={[
                  'inline-flex min-w-[92px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-t-[12px] border px-4 py-2 text-sp-sm font-semibold tracking-[0.14em] transition-colors',
                  isActive
                    ? 'border-[#596fe8] bg-[#243056] text-[#9db0ff]'
                    : 'border-slate-700/70 bg-[#11162a] text-slate-300 hover:border-slate-600 hover:bg-[#1a2034]',
                ].join(' ')}
                aria-pressed={isActive}
                title={tab.label}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleSlippageConfigClick}
            className={[
              'inline-flex min-w-[92px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-t-[12px] border px-4 py-2 text-sp-sm font-semibold tracking-[0.14em] transition-colors',
              slippageVisible
                ? 'border-[#596fe8] bg-[#243056] text-[#9db0ff]'
                : 'border-slate-700/70 bg-[#11162a] text-slate-300 hover:border-slate-600 hover:bg-[#1a2034]',
            ].join(' ')}
            aria-pressed={slippageVisible}
            title="Config"
          >
            <span>Config</span>
          </button>
        </div>
      </div>
    </div>
  );
}
