// File: @/components/views/RadioOverlayPanels/StakingSpCoinsPanel.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import StakeTradingSpCoinsPanel from '@/components/views/AssetSelectPanels/StakeTradingSpCoinsPanel';
import ConnectTradeButton from '@/components/views/Buttons/ConnectTradeButton';
import AddSponsorShipPanel from '@/components/views/TradingStationPanel/AddSponsorshipPanel';

import PanelGate from '@/components/utility/PanelGate';
import { TSP_TW } from '@/components/views/TradingStationPanel/lib/twSettingConfig';

export default function StakingSpCoinsPanel() {

  return (
    <PanelGate panel={SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL}>
      <div id="STAKING_SPCOINS_PANEL" className={`flex flex-col ${TSP_TW.gap}`}>
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
