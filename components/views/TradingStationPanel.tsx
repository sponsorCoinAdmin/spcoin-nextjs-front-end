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
import AddSponsorShipPanel from './AddSponsorshipPanel';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TRADING_STATION_PANEL === 'true';
const debugLog = createDebugLogger('TradingStationPanel', DEBUG_ENABLED, LOG_TIME);

export default function TradingStationPanel() {
  // ✅ Subscribe to just the overlay we render under
  const isActive = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);

  debugLog.log(`🛠️ TradingStationPanel → tradingStationVisible=${isActive}`);
  const { isLoading: isLoadingPrice, data: priceData } = usePriceAPI();

  // Don’t mount anything when this overlay isn’t active
  if (!isActive) return null;

  const priceResponse = isLoadingPrice ? undefined : (priceData as any);

  return (
    <div id="TradingStationPanel">
      {/* Child controls/panels self-gate via their own enum visibility */}
      <SellAssetPanel />
      <BuyAssetPanel />

      <BuySellSwapArrowButton />
      <AddSponsorShipPanel />
      <PriceButton isLoadingPrice={isLoadingPrice} />
      <AffiliateFee priceResponse={priceResponse} />
      <FeeDisclosure />
    </div>
  );
}
