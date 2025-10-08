// File: components/views/MainTradingPanel.tsx
'use client';

import styles from '@/styles/Exchange.module.css';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import TradingStationPanel from '@/components/views/TradingStationPanel';
import ErrorMessagePanel from '@/components/views/ErrorMessagePanel';
import ManageSponsorshipsPanel from '@/components/containers/ManageSponsorShipsPanel';

import {
  TokenSelectPanel,
  RecipientSelectPanel,
  AgentSelectPanel,
} from '@/components/containers/AssetSelectPanels';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';

export default function MainTradingPanel() {
  return (
    <PanelGate panel={SP_COIN_DISPLAY.MAIN_TRADING_PANEL}>
      <div id="MainPage_ID">
        <div id="mainTradingPanel" className={styles.mainTradingPanel}>
          <PanelGate panel={SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER}>
            <TradeContainerHeader />
          </PanelGate>

          <TradingStationPanel />
          <ManageSponsorshipsPanel />
          <TokenSelectPanel />
          <RecipientSelectPanel />
          <AgentSelectPanel />
          <ErrorMessagePanel />
        </div>
      </div>
    </PanelGate>
  );
}
