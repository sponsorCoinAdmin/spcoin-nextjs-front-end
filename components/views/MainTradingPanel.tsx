// File: components/views/MainTradingPanel.tsx
'use client';

import styles from '@/styles/Exchange.module.css';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import TradingStationPanel from './TradingStationPanel';
import ErrorMessagePanel from './ErrorMessagePanel';

import {
  TokenSelectPanel,
  RecipientSelectPanel,
  AgentSelectPanel,
} from '../containers/AssetSelectPanels';

import { SP_COIN_DISPLAY } from '@/lib/structure';

// Phase 7: subscription-based gating
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import PanelGate from '@/components/utility/PanelGate';
import ManageSponsorshipsPanel from '../containers/ManageSponsorShipsPanel';

export default function MainTradingPanel() {
  // 🔔 Subscribe narrowly to MAIN_TRADING_PANEL visibility
  const isActive = usePanelVisible(SP_COIN_DISPLAY.MAIN_TRADING_PANEL);

  if (!isActive) return null;

  return (
    <div id="MainPage_ID">
      <div id="mainTradingPanel" className={styles.mainTradingPanel}>
        {/* Header visibility via PanelGate (make sure PanelGate uses usePanelVisible under the hood) */}
        <PanelGate panel={SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER}>
          <TradeContainerHeader />
        </PanelGate>

        {/* Self-gated children */}
        <TradingStationPanel />
        <ManageSponsorshipsPanel />
        <TokenSelectPanel />
        <RecipientSelectPanel />
        <AgentSelectPanel />
        <ErrorMessagePanel />
      </div>
    </div>
  );
}
