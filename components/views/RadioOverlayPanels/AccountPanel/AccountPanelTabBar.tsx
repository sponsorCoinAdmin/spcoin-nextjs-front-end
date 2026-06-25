'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowLeftRight, FolderCog, HeartHandshake, SendHorizonal } from 'lucide-react';
import cog_png from '@/public/assets/miscellaneous/cog.png';

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
  const { openPanel } = usePanelTree();
  const sponsorVisible = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_PANEL);
  const rewardsVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const swapVisible    = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const sendVisible    = usePanelVisible(SP_COIN_DISPLAY.SEND_PANEL);
  const wacVisible     = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const wncVisible     = usePanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT);

  const isOverlayOpen = wacVisible || wncVisible;
  const derivedKey: TabKey = sponsorVisible ? 'SPONSOR' : swapVisible ? 'SWAP' : sendVisible ? 'SEND' : 'REWARDS';

  const lastTabKey      = useRef<TabKey>(derivedKey);
  const prevOverlayOpen = useRef(false);

  useEffect(() => {
    const wasOpen = prevOverlayOpen.current;
    prevOverlayOpen.current = isOverlayOpen;

    if (wasOpen && !isOverlayOpen) {
      const anyTabActive = sponsorVisible || rewardsVisible || swapVisible || sendVisible;
      if (!anyTabActive) {
        const tab = TABS.find(t => t.key === lastTabKey.current);
        if (tab) openPanel(tab.panel, 'AccountPanelTabBar:restore-after-overlay');
      }
    } else if (!isOverlayOpen) {
      lastTabKey.current = derivedKey;
    }
  }, [isOverlayOpen, derivedKey, sponsorVisible, rewardsVisible, swapVisible, sendVisible, openPanel]);

  const activeKey: TabKey = isOverlayOpen ? lastTabKey.current : derivedKey;

  return (
    <div
      className="shrink-0 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out -mx-4"
      style={{ maxHeight: open ? '80px' : '0px', opacity: open ? 1 : 0 }}
    >
      <div className="relative border-b border-slate-700/70 px-4 pt-3">
        <Image
          src={cog_png}
          alt="Config"
          onClick={() => openPanel(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL, 'AccountPanelTabBar:cog')}
          className="absolute right-[20px] top-[11px] h-[22px] w-[22px] cursor-pointer transition-transform duration-300 hover:rotate-[360deg]"
          priority
        />
        <div className="scrollbar-hide flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 pr-10">
          {TABS.map((tab) => {
            const isActive = tab.key === activeKey;
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
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
