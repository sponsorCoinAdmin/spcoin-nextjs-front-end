// File: components/views/TradingStationPanel/index.tsx
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';

import BuySellSwapArrowButton from '@/components/views/TradingStationPanel/SwapArrowButton';
import ConnectTradeButton from '@/components/views/Buttons/ConnectTradeButton';
import AffiliateFee from '@/components/views/TradingStationPanel/AffiliateFee';
import FeeDisclosure from '@/components/views/TradingStationPanel/FeeDisclosure';
import AddSponsorShipPanel from '@/components/views/TradingStationPanel/AddSponsorshipPanel';
import TradingStationHeader from '@/components/views/TradingStationPanel/TradingStationHeader';

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
      <div id="TRADING_STATION_PANEL" className={`flex flex-col ${TSP_TW.gap}`}>
        <PanelGate panel={SP_COIN_DISPLAY.TRADING_STATION_HEADER}>
          <TradingStationHeader />
        </PanelGate>
        <PanelGate panel={SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL}>
          <ConfigSlippagePanel />
        </PanelGate>

        <PanelGate panel={SP_COIN_DISPLAY.EXCHANGE_TRADING_PAIR}>
          <div
            id="EXCHANGE_TRADING_PAIR"
            className={`relative ${TSP_TW.container} justify-between gap-0 min-h-[216px]`}
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
        </PanelGate>

        <PanelGate panel={SP_COIN_DISPLAY.ADD_SPONSORSHIP_PANEL}>
          <AddSponsorShipPanel />
        </PanelGate>
        <PanelGate panel={SP_COIN_DISPLAY.CONNECT_TRADE_BUTTON}>
          <ConnectTradeButton isLoadingPrice={isLoading} />
        </PanelGate>
        <PanelGate panel={SP_COIN_DISPLAY.AFFILIATE_FEE}>
          <AffiliateFee priceResponse={priceResponse} />
        </PanelGate>
        <PanelGate panel={SP_COIN_DISPLAY.FEE_DISCLOSURE}>
          <FeeDisclosure />
        </PanelGate>
      </div>
    </PanelGate>
  );
}
