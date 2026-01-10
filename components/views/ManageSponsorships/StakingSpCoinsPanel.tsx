// File: @/components/views/StakingSpCoins.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import TradingSpCoinPanel from '@/components/views/TradingStationPanel/AssetSelectPanels/TradingSpCoinPanel';
import PriceButton from '@/components/views/Buttons/PriceButton';
import AddSponsorShipPanel from '@/components/views/AddSponsorshipPanel';

import PanelGate from '@/components/utility/PanelGate';

export default function StakingSpCoins() {

  return (
    <PanelGate panel={SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL}>
      <div id="StakingSpCoins">
        <TradingSpCoinPanel />
        <AddSponsorShipPanel />
        <PriceButton isLoadingPrice={false} />
      </div>
    </PanelGate>
  );
}
