// File: @/components/views/RadioOverlayPanels/gitpushStakingSpCoinsPanel.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import TradingSpCoinPanel from '@/components/views/AssetSelectPanels/TradingSpCoinPanel';
import ConnectTradeButton from '@/components/views/Buttons/ConnectTradeButton';
import AddSponsorShipPanel from '@/components/views/TradingStationPanel/AddSponsorshipPanel';

import PanelGate from '@/components/utility/PanelGate';

export default function StakingSpCoins() {

  return (
    <PanelGate panel={SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL}>
      <div id="StakingSpCoins">
        <TradingSpCoinPanel />
        <AddSponsorShipPanel />
        <ConnectTradeButton isLoadingPrice={false} />
      </div>
    </PanelGate>
  );
}
