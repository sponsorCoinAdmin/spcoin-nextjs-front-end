// File: components/views/Headers/ActiveAccountHeaderBar.tsx
'use client';

import { ArrowLeft } from 'lucide-react';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';

export default function ActiveAccountHeaderBar() {
  const { exchangeContext } = useExchangeContext();
  const { closePanel } = usePanelTree();

  const rewardsTabVisible  = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const tradingTabVisible  = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const activeAccountType  = rewardsTabVisible ? 'Deposit Account' : tradingTabVisible ? 'Trading Account' : 'Active Account';

  return (
    <PanelGate panel={SP_COIN_DISPLAY.ACTIVE_ACCOUNT_HEADER_BAR}>
      <div className="relative shrink-0 border-b border-slate-700/50 px-4 py-3 flex items-center gap-3">
        <div className="pointer-events-none absolute inset-x-0 top-[2px] flex flex-col items-center text-[19px] font-semibold text-[#5981F3]">
          <span>{activeAccountType}</span>
          {exchangeContext?.accounts?.activeAccount?.name && (
            <span>{exchangeContext.accounts.activeAccount.name}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => closePanel('ActiveAccountHeaderBar:back')}
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-[#91a5ff]" />
        </button>
      </div>
    </PanelGate>
  );
}
