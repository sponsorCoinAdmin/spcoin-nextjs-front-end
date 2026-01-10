// File: @/components/views/TradingStationPanel/index.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';

import BuySellSwapArrowButton from '@/components/views/Buttons/BuySellSwapArrowButton';
import PriceButton from '@/components/views/Buttons/PriceButton';
import AffiliateFee from '@/components/views/TradingStationPanel/AffiliateFee';
import FeeDisclosure from '@/components/views/TradingStationPanel/FeeDisclosure';
import AddSponsorShipPanel from '@/components/views/TradingStationPanel/AssetSelectPanels/AddSponsorshipPanel';

import { usePriceAPI } from '@/lib/0x/hooks/usePriceAPI';
import PanelGate from '@/components/utility/PanelGate';
import SellAssetPanel from './AssetSelectPanels/SellAssetPanel';
import BuyAssetPanel from './AssetSelectPanels/BuyAssetPanel';
import ConfigSlippagePanel from '@/components/views/TradingStationPanel/ConfigSponsorshipPanel';

export default function TradingStationPanel() {
  const { isLoading, data } = usePriceAPI();
  const priceResponse = isLoading ? undefined : (data as any);

  return (
    <PanelGate panel={SP_COIN_DISPLAY.TRADING_STATION_PANEL}>
      <div id='TradingStationPanel'>
        <ConfigSlippagePanel />
        <SellAssetPanel />
        <BuySellSwapArrowButton />
        <BuyAssetPanel />
        <AddSponsorShipPanel />
        <PriceButton isLoadingPrice={isLoading} />
        <AffiliateFee priceResponse={priceResponse} />
        <FeeDisclosure />
      </div>
    </PanelGate>
  );
}
