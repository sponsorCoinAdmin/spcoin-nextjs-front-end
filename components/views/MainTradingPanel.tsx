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

// ✅ Gate this whole container by MAIN_TRADING_PANEL visibility
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure';

// ✅ Fixed camel-case + path after rename
import ManageSponsorshipsPanel from '@/components/containers/ManageSponsorshipsPanel';

// ✅ Phase 0: centralize visibility gating with a tiny wrapper
import PanelGate from '@/components/utility/PanelGate';

export default function MainTradingPanel() {
  const { isVisible } = usePanelTree();
  const isActive = isVisible(SP_COIN_DISPLAY.MAIN_TRADING_PANEL);

  if (!isActive) return null;

  return (
    <div id="MainPage_ID">
      <div id="mainTradingPanel" className={styles.mainTradingPanel}>
        {/* Gate header visibility here (component stays dumb/presentational) */}
        <PanelGate panel={SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER}>
          <TradeContainerHeader />
        </PanelGate>

        <TradingStationPanel />
        {/* Visibility is self-managed inside the panel */}
        <ManageSponsorshipsPanel />
        <TokenSelectPanel />
        <RecipientSelectPanel />
        <AgentSelectPanel />
        <ErrorMessagePanel />
      </div>
    </div>
  );
}
