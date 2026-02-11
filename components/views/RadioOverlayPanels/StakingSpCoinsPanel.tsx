// File: @/components/views/RadioOverlayPanels/StakingSpCoinsPanel.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import StakeTradingSpCoinsPanel from '@/components/views/AssetSelectPanels/StakeTradingSpCoinsPanel';
import ConnectTradeButton from '@/components/views/Buttons/ConnectTradeButton';
import AddSponsorShipPanel from '@/components/views/TradingStationPanel/AddSponsorshipPanel';

import PanelGate from '@/components/utility/PanelGate';

export default function StakingSpCoinsPanel() {

  return (
    <PanelGate panel={SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL}>
      <div id="StakingSpCoinsPanel">
        <PanelGate panel={SP_COIN_DISPLAY.STAKE_TRADING_SPCOINS_PANEL}>
          <StakeTradingSpCoinsPanel />
        </PanelGate>
        <PanelGate panel={SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL}>
          <AddSponsorShipPanel />
        </PanelGate>
        <PanelGate panel={SP_COIN_DISPLAY.CONNECT_TRADE_BUTTON}>
          <ConnectTradeButton isLoadingPrice={false} />
        </PanelGate>
      </div>
    </PanelGate>
  );
}
