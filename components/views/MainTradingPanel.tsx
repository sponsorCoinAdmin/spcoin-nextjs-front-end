// File: components/panes/MainTradingPanel.tsx
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
import ManageSponsorShipsPanel from '@/components/containers/ManageSponsorShipsPanel';

// ✅ New: gate this whole container by MAIN_TRADING_PANEL visibility
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export default function MainTradingPanel() {
  const { isVisible } = usePanelTree();
  const isActive = isVisible(SP_COIN_DISPLAY.MAIN_TRADING_PANEL);

  // Hide the entire main trading container unless MAIN_TRADING_PANEL is active
  if (!isActive) return null;

  return (
    <div id="MainPage_ID">
      <div id="mainTradingPanel" className={styles.mainTradingPanel}>
        <TradeContainerHeader />
        <TradingStationPanel />
        <ManageSponsorShipsPanel />
        <TokenSelectPanel />
        <RecipientSelectPanel />
        <AgentSelectPanel />
        <ErrorMessagePanel />
      </div>
    </div>
  );
}
