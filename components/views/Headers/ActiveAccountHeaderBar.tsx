// File: components/views/Headers/ActiveAccountHeaderBar.tsx
'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';

export default function ActiveAccountHeaderBar() {
  const { exchangeContext } = useExchangeContext();

  const rewardsTabVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const tradingTabVisible = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const activeAccountType = rewardsTabVisible ? 'Deposit Account' : tradingTabVisible ? 'Trading Account' : 'Active Account';

  const activeAccount = exchangeContext?.accounts?.activeAccount;

  return (
    <PanelGate panel={SP_COIN_DISPLAY.ACTIVE_ACCOUNT_HEADER_BAR}>
      <div className="relative shrink-0 border-b border-slate-700/50 -mx-4 px-4 py-3 flex items-center justify-center text-[19px] font-semibold text-[#5981F3]">
        <span>{activeAccountType}{activeAccount?.name ? `: ${activeAccount.name}` : ''}</span>
      </div>
    </PanelGate>
  );
}
