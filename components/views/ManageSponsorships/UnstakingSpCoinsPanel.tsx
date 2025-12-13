// File: @/components/views/UnstakingSpCoins.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import BuyAssetPanel from '@/components/containers/AssetSelectPanels/BuyAssetPanel';
import PriceButton from '@/components/Buttons/PriceButton';
import AddSponsorShipPanel from '@/components/views/AddSponsorshipPanel';
import PanelGate from '@/components/utility/PanelGate';

export default function UnstakingSpCoins() {
  return (
    <PanelGate panel={SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL}>
      <div id="UnstakingSpCoins">
        <BuyAssetPanel />
        <AddSponsorShipPanel />
        <PriceButton isLoadingPrice={false} />
      </div>
    </PanelGate>
  );
}
