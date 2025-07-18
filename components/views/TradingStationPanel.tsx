// File: components/views/TradingStationPanel.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { CONTAINER_TYPE, SP_COIN_DISPLAY } from '@/lib/structure';

import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
import PriceButton from '@/components/Buttons/PriceButton';
import AffiliateFee from '@/components/containers/AffiliateFee';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import { TokenSelectPanel } from '../containers/AssetSelectPanels';

import { useActiveDisplay } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';
import { AssetSelectScrollPanel, TokenSelectScrollPanel } from '../containers/AssetSelectScrollPanels';
import { TokenPanelProvider } from '@/lib/context/TokenPanelProviders/TokenPanelProvider';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MAIN_SWAP_VIEW === 'true';
const debugLog = createDebugLogger('TradingStationPanel', DEBUG_ENABLED, LOG_TIME);

export default function TradingStationPanel() {
  const { activeDisplay } = useActiveDisplay();

  debugLog.log(`🔍 TradingStationPanel render triggered`);
  debugLog.log(`🧩 Current activeDisplay = ${getActiveDisplayString(activeDisplay)}`);

  const isActive = activeDisplay === SP_COIN_DISPLAY.SHOW_TRADING_STATION_PANEL;

  const { isLoading: isLoadingPrice, data: priceData } = usePriceAPI();

  return (
    <div
      id="MainPage_ID"
      className={isActive ? '' : 'hidden'} // ✅ Tailwind hidden class instead of inline style
    >
      <div id="MainSwapContainer_ID" className={styles.mainSwapContainer}>
        <TradeContainerHeader />

        {/* <SharedPanelProvider>
          <TokenSelectScrollPanel />
        </SharedPanelProvider> */}

        <TokenPanelProvider containerType={CONTAINER_TYPE.SELL_SELECT_CONTAINER}>
          <TokenSelectPanel />
        </TokenPanelProvider>

        {/* <TokenPanelProvider containerType={CONTAINER_TYPE.BUY_SELECT_CONTAINER}>
          <TokenSelectPanel  />
        </TokenPanelProvider> */}

        <BuySellSwapArrowButton />
        <PriceButton isLoadingPrice={isLoadingPrice} />
        <AffiliateFee priceResponse={priceData} />
      </div>
      <FeeDisclosure />
    </div>
  );
}
