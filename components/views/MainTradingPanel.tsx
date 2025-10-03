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

export default function MainTradingPanel() {
  return (
    <div id="MainPage_ID">
      <div id="mainTradingPanel" className={styles.mainTradingPanel}>
        {/* Header no longer needs a close callback */}
        <TradeContainerHeader />

        {/* Each child gates itself via the panel tree */}
        <TradingStationPanel />
        <ManageSponsorShipsPanel tokenContract={undefined} />

        {/* Non-radio overlays self-gate internally */}
        <TokenSelectPanel />
        <RecipientSelectPanel />
        <AgentSelectPanel />

        {/* Error panel self-gates as well */}
        <ErrorMessagePanel />
      </div>
    </div>
  );
}
