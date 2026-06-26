'use client';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';

export default function PanelSubTitle() {
  const sendVisible    = usePanelVisible(SP_COIN_DISPLAY.SEND_PANEL);
  const rewardsVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const swapVisible    = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const sponsorVisible = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_PANEL);

  const text = sendVisible    ? 'Send'
    : rewardsVisible ? 'Manage Rewards'
    : swapVisible    ? 'Trading Station'
    : sponsorVisible ? 'Add a Sponsorship'
    : null;

  if (!text) return null;

  return (
    <div id="PANEL_SUB_TITLE" className="relative shrink-0 select-none py-3 text-center">
      <h2 className="m-0 text-xl font-extrabold leading-tight tracking-wide text-white md:text-2xl">
        {text}
      </h2>
    </div>
  );
}
