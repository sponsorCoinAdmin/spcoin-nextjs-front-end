// File: @/components/views/TradingStationPanel/index.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';

import BuySellSwapArrowButton from '@/components/views/TradingStationPanel/SwapArrowButton';
import ConnectTradeButton from '@/components/views/Buttons/ConnectTradeButton';
import AffiliateFee from '@/components/views/TradingStationPanel/AffiliateFee';
import FeeDisclosure from '@/components/views/TradingStationPanel/FeeDisclosure';
// import AddSponsorShipPanel from '@/components/views/TradingStationPanel/AssetSelectPCFanels/AddSponsorshipPanel';
import AddSponsorShipPanel from '@/components/views/TradingStationPanel/AddSponsorshipPanel';

import { usePriceAPI } from '@/lib/0x/hooks/usePriceAPI';
import PanelGate from '@/components/utility/PanelGate';
import SellSelectPanel from './SellSelectPanel';
import BuySelectPanel from './BuySelectPanel';
import ConfigSlippagePanel from '@/components/views/TradingStationPanel/ConfigSlippagePanel';
import { TSP_TW } from '@/components/views/TradingStationPanel/lib/twSettingConfig';

export default function TradingStationPanel() {
  const { isLoading, data } = usePriceAPI();
  const priceResponse = isLoading ? undefined : (data as any);

  return (
    <PanelGate panel={SP_COIN_DISPLAY.TRADING_STATION_PANEL}>
      <div id="TradingStationPanel" className={`flex flex-col ${TSP_TW.gap}`}>
        <ConfigSlippagePanel />

        <div
          id="TRADING_PAIR"
          className={`relative ${TSP_TW.container} ${TSP_TW.gap} min-h-[216px] `}
        >
          <div className={TSP_TW.slot}>
            <SellSelectPanel />
          </div>

          <div className={TSP_TW.arrowSlot}>
            <BuySellSwapArrowButton />
          </div>

          <div className={TSP_TW.slot}>
            <BuySelectPanel />
          </div>
        </div>

        <AddSponsorShipPanel />
        <ConnectTradeButton isLoadingPrice={isLoading} />
        <AffiliateFee priceResponse={priceResponse} />
        <FeeDisclosure />
      </div>
    </PanelGate>
  );
}
