// File: components/containers/TradingStationPanel.tsx

'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import SellAssetPanel from '@/components/containers/AssetSelectPanels/SellAssetPanel';
import BuyAssetPanel from '@/components/containers/AssetSelectPanels/BuyAssetPanel';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
import PriceButton from '@/components/Buttons/PriceButton';
import AffiliateFee from '@/components/containers/AffiliateFee';

import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import FeeDisclosure from '../containers/FeeDisclosure';
import RecipientSelectTradingPanel from './RecipientSelectTradingPanel';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TRADING_STATION_PANEL === 'true';
const debugLog = createDebugLogger('TradingStationPanel', DEBUG_ENABLED, LOG_TIME);

export default function TradingStationPanel() {
  const { isVisible } = usePanelTree();
  const isActive = isVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);

  debugLog.log(`🛠️ TradingStationPanel → tradingStationVisible=${isActive}`);

  const { isLoading: isLoadingPrice, data: priceData } = usePriceAPI();
  const priceResponse = isLoadingPrice ? undefined : (priceData as any);

  return (
    <div id="TradingStationPanel" className={isActive ? '' : 'hidden'}>
      {/* Panels are now visibility-gated inside these wrappers */}
      <SellAssetPanel />
      <BuyAssetPanel />

      <BuySellSwapArrowButton />
      <RecipientSelectTradingPanel />
      <PriceButton isLoadingPrice={isLoadingPrice} />
      <AffiliateFee priceResponse={priceResponse} />
      <FeeDisclosure />
    </div>
  );
}
