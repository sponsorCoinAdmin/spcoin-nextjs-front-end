// File: components/views/MeritWalletComponent.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import ConnectNetworkButton from '@/components/views/Buttons/Connect/ConnectNetworkButton';
import AgentHeaderContainer from '@/components/views/Headers/AgentHeaderContainer';
import MenuTabHeaderBar from '@/components/views/Headers/MenuTabHeaderBar';
import AddressHeaderBar from '@/components/views/Headers/AddressHeaderBar';
import TradeContainerHeader from '@/components/views/Headers/TradeContainerHeader';
import RadioOverlayPanelHost from '@/components/views/RadioOverlayPanelHost';
import WalletHeader from '@/components/views/WalletHeader';
import PanelGate from '@/components/utility/PanelGate';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { SP_COIN_DISPLAY } from '@/lib/structure';

const MENU    = 1;  // bit 0 → MENU_TAB_HEADER_BAR
const ADDRESS = 2;  // bit 1 → ADDRESS_HEADER_BAR

// Gray-code cycle: 0 → 1 → 3 → 2 → 0  (each step flips one bit)
const NEXT_STATE: Readonly<Record<number, number>> = { 0: 1, 1: 3, 3: 2, 2: 0 };

function selectPanel(
  current: number,
  setPanelVisible: (panel: SP_COIN_DISPLAY, visible: boolean) => void,
): number {
  const next = NEXT_STATE[current] ?? 0;
  setPanelVisible(SP_COIN_DISPLAY.MENU_TAB_HEADER_BAR, (next & MENU)    !== 0);
  setPanelVisible(SP_COIN_DISPLAY.ADDRESS_HEADER_BAR,  (next & ADDRESS) !== 0);
  return next;
}

export default function MeritWalletComponent() {
  const { closeWallet } = useSpCoinWallet();
  const { openPanel, closePanel, setPanelVisible } = usePanelTree();
  const [panelHeaderDisplay, setPanelHeaderDisplay] = useState(0);

  const tradingStationHeaderOpen = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_HEADER);
  const walletAccountsVisible    = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const walletNetworksVisible    = usePanelVisible(SP_COIN_DISPLAY.WALLET_NETWORKS_COMPONENT);
  const rewardsTabVisible        = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const tradingStationTabVisible = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const walletConfigTabVisible   = usePanelVisible(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL);

  const title = walletConfigTabVisible     ? 'Wallet Config'
    : tradingStationTabVisible ? 'Trading Station'
    : rewardsTabVisible        ? 'Account Rewards'
    : walletAccountsVisible    ? 'Merit Wallet'
    : 'Merit Wallet';

  // Start at state 0 (MENU and ADDRESS hidden) on mount — intentionally no deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPanelVisible(SP_COIN_DISPLAY.MENU_TAB_HEADER_BAR, false);
    setPanelVisible(SP_COIN_DISPLAY.ADDRESS_HEADER_BAR,  false);
  }, []);

  const handleMenuClick = useCallback(() => {
    const next = selectPanel(panelHeaderDisplay, setPanelVisible);
    setPanelHeaderDisplay(next);
  }, [panelHeaderDisplay, setPanelVisible]);

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
          onMenuClick={handleMenuClick}
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
          <AgentHeaderContainer />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
              <div id="UNDEFINED" className="hidden" aria-hidden="true" />
              <div
                id="mainTradingPanel"
                className={styles.mainTradingPanel}
                style={{ transform: 'none', width: '100%', flex: 1, minHeight: 0, maxHeight: '100%', margin: 0 }}
              >
                <MenuTabHeaderBar />
                <AddressHeaderBar />
                <PanelGate panel={SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER}>
                  <div id="TRADE_CONTAINER_HEADER">
                    <div
                      className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                      style={{
                        maxHeight: tradingStationHeaderOpen ? '80px' : '0px',
                        opacity: tradingStationHeaderOpen ? 1 : 0,
                      }}
                    >
                      <TradeContainerHeader />
                    </div>
                  </div>
                </PanelGate>
                <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto flex flex-col">
                  <RadioOverlayPanelHost />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanelGate>
  );
}
