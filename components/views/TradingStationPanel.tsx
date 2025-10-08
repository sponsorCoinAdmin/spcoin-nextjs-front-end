// File: components/views/TradingStationPanel.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import SellAssetPanel from '@/components/containers/AssetSelectPanels/SellAssetPanel';
import BuyAssetPanel from '@/components/containers/AssetSelectPanels/BuyAssetPanel';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
import PriceButton from '@/components/Buttons/PriceButton';
import AffiliateFee from '@/components/containers/AffiliateFee';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import AddSponsorShipPanel from '@/components/views/AddSponsorshipPanel';

import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';
import PanelGate from '@/components/utility/PanelGate';

export default function TradingStationPanel() {
  const { isLoading, data } = usePriceAPI();
  const priceResponse = isLoading ? undefined : (data as any);

  return (
    <PanelGate panel={SP_COIN_DISPLAY.TRADING_STATION_PANEL}>
      <div id="TradingStationPanel">
        <SellAssetPanel />
        <BuyAssetPanel />
        <BuySellSwapArrowButton />
        <AddSponsorShipPanel />
        <PriceButton isLoadingPrice={isLoading} />
        <AffiliateFee priceResponse={priceResponse} />
        <FeeDisclosure />
      </div>
    </PanelGate>
  );
}
