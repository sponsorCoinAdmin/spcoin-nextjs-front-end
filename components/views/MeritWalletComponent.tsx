// File: components/views/MeritWalletComponent.tsx
'use client';

import { useCallback } from 'react';

const AGENT_TITLE   = process.env.NEXT_PUBLIC_AGENT_PAGE_TITLE ?? 'Sponsor Sick Kids Hospital';
const AGENT_SUBTITLE = process.env.NEXT_PUBLIC_AGENT_SUB_TITLE  ?? 'Your Sponsor Agent';

import ConnectNetworkButton from '@/components/views/Buttons/Connect/ConnectNetworkButton';
import MainTradingPanel from '@/components/views/MainTradingPanel';
import WalletHeader from '@/components/views/WalletHeader';
import PanelGate from '@/components/utility/PanelGate';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export default function MeritWalletComponent() {
  const { closeWallet } = useSpCoinWallet();
  const { openPanel, closePanel } = usePanelTree();

  const tabsOpen               = usePanelVisible(SP_COIN_DISPLAY.MENU_TAB_HEADER_BAR);
  const walletAccountsVisible  = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const walletNetworksVisible  = usePanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT);
  const rewardsTabVisible      = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const tradingStationTabVisible = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const walletConfigTabVisible   = usePanelVisible(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL);

  const title = walletConfigTabVisible    ? 'Wallet Config'
    : tradingStationTabVisible ? 'Trading Station'
    : rewardsTabVisible        ? 'Account Rewards'
    : walletAccountsVisible    ? 'Merit Wallet'
    : 'Merit Wallet';

  const handleNetworkChevron = useCallback(() => {
    if (walletNetworksVisible)
      closePanel(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, 'MeritWalletComponent:networkChevronClose');
    else
      openPanel(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT, 'MeritWalletComponent:networkChevronOpen');
  }, [closePanel, openPanel, walletNetworksVisible]);

  return (
    <PanelGate panel={SP_COIN_DISPLAY.MERIT_WALLET_COMPONENT}>
      <div className="flex h-[min(650px,calc(100vh-230px))] min-h-[300px] w-[min(520px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl pointer-events-auto">
        <WalletHeader
          mode="normal"
          title={title}
          onMenuClick={() => {
            if (tabsOpen) closePanel(SP_COIN_DISPLAY.MENU_TAB_HEADER_BAR, 'MeritWalletComponent:hamburger');
            else openPanel(SP_COIN_DISPLAY.MENU_TAB_HEADER_BAR, 'MeritWalletComponent:hamburger');
          }}
          menuButtonKind="menu"
          leftSlot={
            <ConnectNetworkButton
              showName={false}
              showSymbol={true}
              showChevron={true}
              showConnect={true}
              showDisconnect={false}
              showHoverBg={true}
              onChevronClick={handleNetworkChevron}
              chevronUp={walletNetworksVisible}
            />
          }
          onClose={closeWallet}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 select-none py-3 text-center">
            <h2 className="m-0 text-xl font-extrabold leading-tight tracking-wide text-[#5981F3] md:text-2xl">
              {AGENT_TITLE}
            </h2>
            <p className="m-0 mt-0.5 text-xs text-white/70">{AGENT_SUBTITLE}</p>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <MainTradingPanel embeddedInPopup />
          </div>
        </div>
      </div>
    </PanelGate>
  );
}
