// File: components/views/Headers/ActiveAccountHeaderBar.tsx
'use client';

import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import { useCallback } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';

export default function ActiveAccountHeaderBar() {
  const { exchangeContext } = useExchangeContext();
  const { openPanel, closePanel } = usePanelTree();

  const rewardsTabVisible  = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const tradingTabVisible  = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const sendTabVisible     = usePanelVisible(SP_COIN_DISPLAY.SEND_PANEL);
  const sponsorTabVisible  = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_PANEL);
  const slippageVisible    = usePanelVisible(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL);

  const activeAccountType  = rewardsTabVisible  ? 'Deposit Account'
    : tradingTabVisible  ? 'Trading Station'
    : sendTabVisible     ? 'Send Account'
    : sponsorTabVisible  ? 'Sponsor Account'
    : 'Active Account';

  const activeAccount = exchangeContext?.accounts?.activeAccount;

  const handleCogClick = useCallback(() => {
    if (slippageVisible) {
      closePanel(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL, 'ActiveAccountHeaderBar:cog:close');
    } else {
      openPanel(SP_COIN_DISPLAY.CONFIG_SLIPPAGE_PANEL, 'ActiveAccountHeaderBar:cog:open');
    }
  }, [slippageVisible, openPanel, closePanel]);

  return (
    <PanelGate panel={SP_COIN_DISPLAY.ACTIVE_ACCOUNT_HEADER_BAR}>
      <div className="relative shrink-0 border-b border-slate-700/50 px-4 py-3 flex items-center justify-center text-[19px] font-semibold text-[#5981F3]">
        <span>{activeAccount?.name ? `${activeAccount.name}: ${activeAccountType}` : activeAccountType}</span>
        {tradingTabVisible && (
          <Image
            src={cog_png}
            alt="Open slippage settings"
            title="Open slippage settings"
            onClick={handleCogClick}
            className="ml-2 relative -top-[5px] h-[18px] w-[18px] shrink-0 object-contain cursor-pointer transition duration-300 hover:rotate-[360deg]"
            priority
          />
        )}
      </div>
    </PanelGate>
  );
}
