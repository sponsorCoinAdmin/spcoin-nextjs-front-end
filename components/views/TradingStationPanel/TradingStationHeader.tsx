// File: components/views/TradingStationPanel/TradingStationHeader.tsx
'use client';

import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import AccountAvatar from '@/components/utility/AccountAvatar';

export default function TradingStationHeader() {
  const { exchangeContext } = useExchangeContext();
  const { openPanel, closePanel, isVisible } = usePanelTree();
  const open = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_HEADER);

  const activeAccount = (exchangeContext as any)?.accounts?.activeAccount;
  const logoURL = activeAccount?.logoURL as string | undefined;

  const handleCogClick = () => {
    if (isVisible(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL)) {
      closePanel(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL, 'TradingStationHeader:cog:close');
    } else {
      openPanel(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL, 'TradingStationHeader:cog:open');
    }
  };

  return (
    <div
      className="shrink-0 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
      style={{ maxHeight: open ? '60px' : '0px', opacity: open ? 1 : 0 }}
    >
      <div
        id="TRADING_STATION_HEADER"
        className="grid grid-cols-[auto_1fr_auto] items-center w-full h-[50px] min-h-[50px] shrink-0"
      >
        <div className="flex items-center h-[38px] w-[38px] overflow-hidden rounded">
          {logoURL ? (
            <AccountAvatar
              logoURL={logoURL}
              symbol={activeAccount?.symbol}
              name={activeAccount?.name}
              address={activeAccount?.address}
              className="h-full w-full object-contain"
            />
          ) : null}
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
    </div>
  );
}
