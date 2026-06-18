// File: components/views/TradingStationPanel/TradingStationHeader.tsx
'use client';

import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';

export default function TradingStationHeader() {
  const { exchangeContext } = useExchangeContext();
  const { openPanel, closePanel, isVisible } = usePanelTree();

  const logoURL = (exchangeContext as any)?.accounts?.activeAccount?.logoURL as string | undefined;

  const handleCogClick = () => {
    if (isVisible(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL)) {
      closePanel(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL, 'TradingStationHeader:cog:close');
    } else {
      openPanel(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL, 'TradingStationHeader:cog:open');
    }
  };

  return (
    <PanelGate panel={SP_COIN_DISPLAY.TRADING_STATION_HEADER}>
      <div
        id="TRADING_STATION_HEADER"
        className="grid grid-cols-[auto_1fr_auto] items-center w-full h-[50px] min-h-[50px] shrink-0"
      >
        <div className="flex items-center">
          {logoURL ? (
            <img
              src={logoURL}
              alt="Active account logo"
              className="h-[38px] w-[38px] object-contain rounded"
            />
          ) : (
            <div className="h-[38px] w-[38px]" />
          )}
        </div>

        <h4 className="justify-self-center m-0 text-base font-semibold text-center select-none leading-none">
          Trading Station
        </h4>

        <Image
          src={cog_png}
          alt="Open slippage settings"
          title="Open slippage settings"
          onClick={handleCogClick}
          className="h-5 w-5 object-contain cursor-pointer transition duration-300 hover:rotate-[360deg]"
          priority
        />
      </div>
    </PanelGate>
  );
}
