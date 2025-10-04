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

// ✅ Gate this whole container by MAIN_TRADING_PANEL visibility
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import ManageSponsorshipsPanel from '../containers/ManageSponsorShipsPanel';

export default function MainTradingPanel() {
  const { isVisible } = usePanelTree();
  const isActive = isVisible(SP_COIN_DISPLAY.MAIN_TRADING_PANEL);

  if (!isActive) return null;

  return (
    <div id="MainPage_ID">
      <div id="mainTradingPanel" className={styles.mainTradingPanel}>
        <TradeContainerHeader />
        <TradingStationPanel />
        {/* Visibility is now self-managed inside the panel */}
        <ManageSponsorshipsPanel />
        <TokenSelectPanel />
        <RecipientSelectPanel />
        <AgentSelectPanel />
        <ErrorMessagePanel />
      </div>
    </div>
  );
}
