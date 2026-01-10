// File: @/components/views/TradingStationPanel/index.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';

import BuySellSwapArrowButton from '@/components/views/TradingStationPanel/SwapArrowButton';
import PriceButton from '@/components/views/Buttons/PriceButton';
import AffiliateFee from '@/components/views/TradingStationPanel/AffiliateFee';
import FeeDisclosure from '@/components/views/TradingStationPanel/FeeDisclosure';
import AddSponsorShipPanel from '@/components/views/TradingStationPanel/AddSponsorshipPanel';

import { usePriceAPI } from '@/lib/0x/hooks/usePriceAPI';
import PanelGate from '@/components/utility/PanelGate';
import SellSelectPanel from './SellSelectPanel';
import BuySelectPanel from './BuySelectPanel';
import ConfigSlippagePanel from '@/components/views/TradingStationPanel/ConfigSlippagePanel';

// ✅ Single-source spacing config (create this file as discussed)
import { TSP_TW } from '@/components/views/TradingStationPanel/lib/twSettingConfig';

export default function TradingStationPanel() {
  const { isLoading, data } = usePriceAPI();
  const priceResponse = isLoading ? undefined : (data as any);

  return (
    <PanelGate panel={SP_COIN_DISPLAY.TRADING_STATION_PANEL}>
      <div
        id="TradingStationPanel"
        className={`${TSP_TW.container} ${TSP_TW.gap}`}
      >
        <div className={TSP_TW.slot}>
          <ConfigSlippagePanel />
        </div>

        <div className={TSP_TW.slot}>
          <SellSelectPanel />
        </div>

        {/* exception: arrow spacing can be tuned independently */}
        <div className={TSP_TW.arrowSlot}>
          <BuySellSwapArrowButton />
        </div>

        <div className={TSP_TW.slot}>
          <BuySelectPanel />
        </div>

        <div className={TSP_TW.slot}>
          <AddSponsorShipPanel />
        </div>

        <div className={TSP_TW.slot}>
          <PriceButton isLoadingPrice={isLoading} />
        </div>

        <div className={TSP_TW.slot}>
          <AffiliateFee priceResponse={priceResponse} />
        </div>

        <div className={TSP_TW.slot}>
          <FeeDisclosure />
        </div>
      </div>
    </PanelGate>
  );
}
