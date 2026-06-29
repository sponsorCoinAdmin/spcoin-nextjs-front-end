// File: components/views/Headers/AddressHeaderBar.tsx
'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';
import ActiveAccount from '@/components/views/RadioOverlayPanels/AccountPanel/ActiveAccount';
import ActiveAccountHeaderBar from '@/components/views/Headers/ActiveAccountHeaderBar';

export default function AddressHeaderBar() {
  const { exchangeContext } = useExchangeContext();
  const rewardsTabVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const tradingTabVisible = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const activeAccountType = rewardsTabVisible ? 'Deposit Account' : tradingTabVisible ? 'Trading Account' : 'Active Account';

  return (
    <PanelGate panel={SP_COIN_DISPLAY.ADDRESS_HEADER_BAR}>
      <div>
        <ActiveAccountHeaderBar />
        <ActiveAccount
          account={exchangeContext?.accounts?.activeAccount}
          accountType={activeAccountType}
          showTitle={false}
        />
      </div>
    </PanelGate>
  );
}
