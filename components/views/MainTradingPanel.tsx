// File: components/views/MainTradingPanel.tsx

'use client';

import styles from '@/styles/Exchange.module.css';

import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import FeeDisclosure from '@/components/containers/FeeDisclosure';

import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';
import TradingStationPanel from './TradingStationPanel';
import ErrorMessagePanel from './ErrorMessagePanel';
import SponsorRateConfigPanel from '../containers/SponsorRateConfigPanel';
import { TokenSelectScrollPanel } from '../containers/AssetSelectScrollPanels';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MAIN_SWAP_VIEW === 'true';
const debugLog = createDebugLogger('MainTradingPanel', DEBUG_ENABLED, LOG_TIME);

export default function MainTradingPanel() {
  const { activeDisplay } = useActiveDisplay();

  debugLog.log(`🔍 MainTradingPanel render triggered`);
  debugLog.log(`🧩 Current activeDisplay = ${getActiveDisplayString(activeDisplay)}`);

  const { isLoading: isLoadingPrice, data: priceData } = usePriceAPI();

  return (
    <div id="MainPage_ID">
      <div id="mainTradingPanel" className={styles.mainTradingPanel}>
        <TradeContainerHeader />
        <TradingStationPanel />
        <TokenSelectScrollPanel />
        <ErrorMessagePanel />
        {/* <SponsorRateConfigPanel /> */}
      </div>
      <FeeDisclosure />
    </div>
  );
}
