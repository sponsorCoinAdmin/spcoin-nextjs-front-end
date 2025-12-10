// File: @/components/views/ManageTradingSpCoins.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import SellAssetPanel from '@/components/containers/AssetSelectPanels/SellAssetPanel';
import BuyAssetPanel from '@/components/containers/AssetSelectPanels/BuyAssetPanel';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
import PriceButton from '@/components/Buttons/PriceButton';
import AffiliateFee from '@/components/containers/AffiliateFee';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import AddSponsorShipPanel from '@/components/views/AddSponsorshipPanel';

import { usePriceAPI } from '@/lib/0x/hooks/usePriceAPI';
import PanelGate from '@/components/utility/PanelGate';
import ConfigSponsorshipPanel from './ConfigSlippagePanel';

// ...

export default function ManageTradingSpCoins() {
  const { isLoading, data } = usePriceAPI();
  const priceResponse = isLoading ? undefined : (data as any);

  return (
    <PanelGate panel={SP_COIN_DISPLAY.MANAGE_TRADING_SPCOINS_PANEL}>
      <div id="ManageTradingSpCoins">
        <BuyAssetPanel />
        <AddSponsorShipPanel />
        <PriceButton isLoadingPrice={isLoading} />
      </div>
    </PanelGate>
  );
}
