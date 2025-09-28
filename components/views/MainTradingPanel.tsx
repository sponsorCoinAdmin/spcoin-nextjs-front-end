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
import SponsorshipsConfigPanel from '@/components/containers/SponsorshipsConfigPanel';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MAIN_SWAP_VIEW === 'true';
const debugLog = createDebugLogger('MainTradingPanel', DEBUG_ENABLED, LOG_TIME);

export default function MainTradingPanel() {
  const { isVisible, openPanel } = usePanelTree();

  const isTradingStationVisible = isVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const isErrorMessagePanel     = isVisible(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL);
  const isSponsorshipsPanel     = isVisible(SP_COIN_DISPLAY.SPONSOR_SELECT_PANEL_LIST);

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

        {/* Sponsorships config overlay (uses panel-tree visibility internally) */}
        <SponsorshipsConfigPanel
          showPanel={isSponsorshipsPanel}
          tokenContract={undefined}
          callBackSetter={() => null}
        />
      </div>
    </div>
  );
}
