// File: @/components/views/ManageTradingSpCoins.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import TradingSpCoinPanel from '@/components/containers/AssetSelectPanels/TradingSpCoinPanel';
import PriceButton from '@/components/Buttons/PriceButton';
import AddSponsorShipPanel from '@/components/views/AddSponsorshipPanel';

import PanelGate from '@/components/utility/PanelGate';

export default function ManageTradingSpCoins() {

  return (
    <PanelGate panel={SP_COIN_DISPLAY.MANAGE_STAKING_SPCOINS_PANEL}>
      <div id="ManageTradingSpCoins">
        <TradingSpCoinPanel />
        <AddSponsorShipPanel />
        <PriceButton isLoadingPrice={false} />
      </div>
    </PanelGate>
  );
}
