// File: components/containers/TradingStationPanel.tsx

'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { TradeAssetPanel } from '../containers/AssetSelectPanels';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
import PriceButton from '@/components/Buttons/PriceButton';
import AffiliateFee from '@/components/containers/AffiliateFee';

import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';
import { useActiveDisplay } from '@/lib/context/hooks';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import TradeContainerHeader from '../Headers/TradeContainerHeader';
import FeeDisclosure from '../containers/FeeDisclosure';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TRADING_STATION_PANEL === 'true';
const debugLog = createDebugLogger('TradingStationPanel', DEBUG_ENABLED, LOG_TIME);

export default function TradingStationPanel() {
  const { activeDisplay } = useActiveDisplay();
  const isActive = activeDisplay === SP_COIN_DISPLAY.TRADING_STATION_PANEL;

  debugLog.log(
    `🛠️ TradingStationPanel → activeDisplay:`,
    getActiveDisplayString(activeDisplay)
  );

  const { isLoading: isLoadingPrice, data: priceData } = usePriceAPI();

  return (
    <div id="TradingStationPanel" className={isActive ? '' : 'hidden'}>
      <TradeAssetPanel containerType={SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL} />
      <TradeAssetPanel containerType={SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL} />
      <BuySellSwapArrowButton />
      <PriceButton isLoadingPrice={isLoadingPrice} />
      <AffiliateFee priceResponse={priceData} />
      <FeeDisclosure />
    </div>
  );
}
