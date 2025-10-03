// File: components/panes/MainTradingPanel.tsx
'use client';

import { useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import TradingStationPanel from './TradingStationPanel';
import ErrorMessagePanel from './ErrorMessagePanel';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import {
  TokenSelectPanel,
  RecipientSelectPanel,
  AgentSelectPanel,
} from '../containers/AssetSelectPanels';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import ManageSponsorShipsPanel from '@/components/containers/ManageSponsorShipsPanel';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MAIN_SWAP_VIEW === 'true';
const debugLog = createDebugLogger('MainTradingPanel', DEBUG_ENABLED, LOG_TIME);

export default function MainTradingPanel() {
  const { isVisible, openPanel } = usePanelTree();

  const isTradingStationVisible  = isVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const isErrorMessagePanel      = isVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
  // ✅ new panel visibility
  const isManageSponsorshipsPanel = isVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);

  // “Close overlays” = switch main overlay back to TRADING
  const closePanelCallback = useCallback(() => {
    debugLog.log('🛑 closePanelCallback → openPanel(TRADING_STATION_PANEL)');
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }, [openPanel]);

  return (
    <div id="MainPage_ID">
      <div id="mainTradingPanel" className={styles.mainTradingPanel}>
        <TradeContainerHeader closePanelCallback={closePanelCallback} />

        {/* Trading Station (gated by tree visibility) */}
        {isTradingStationVisible && <TradingStationPanel />}

        {/* Selection overlays self-gate & self-commit via useSelectionCommit */}
        <TokenSelectPanel />
        <RecipientSelectPanel />
        <AgentSelectPanel />

        {/* Error panel */}
        <ErrorMessagePanel isActive={isErrorMessagePanel} />

        {/* Manage Sponsorships overlay (visibility controlled by panel-tree) */}
        <ManageSponsorShipsPanel
          showPanel={isManageSponsorshipsPanel}
          tokenContract={undefined}
        />
      </div>
    </div>
  );
}
