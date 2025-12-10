// File: @/components/views/ManageTradingSpCoins.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import BuyAssetPanel from '@/components/containers/AssetSelectPanels/BuyAssetPanel';
import PriceButton from '@/components/Buttons/PriceButton';
import AddSponsorShipPanel from '@/components/views/AddSponsorshipPanel';

import PanelGate from '@/components/utility/PanelGate';

export default function ManageTradingSpCoins() {

  return (
    <PanelGate panel={SP_COIN_DISPLAY.MANAGE_TRADING_SPCOINS_PANEL}>
      <div id="ManageTradingSpCoins">
        <BuyAssetPanel />
        <AddSponsorShipPanel />
        <PriceButton isLoadingPrice={false} />
      </div>
    </PanelGate>
  );
}
