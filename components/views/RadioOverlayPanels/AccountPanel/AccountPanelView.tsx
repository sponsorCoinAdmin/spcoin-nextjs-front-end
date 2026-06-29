'use client';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import AccountPanelContent from '@/components/views/RadioOverlayPanels/AccountPanel/AccountPanelContent';
import ManageSponsorshipsPanel from '@/components/views/RadioOverlayPanels/ManageSponsorshipsPanel';
import TradingStationPanel from '@/components/views/TradingStationPanel';

type AccountPanelViewProps = {
  account?: spCoinAccount;
  mode?:
    | SP_COIN_DISPLAY.ACTIVE_ACCOUNT
    | SP_COIN_DISPLAY.SPONSOR_ACCOUNT
    | SP_COIN_DISPLAY.RECIPIENT_ACCOUNT
    | SP_COIN_DISPLAY.AGENT_ACCOUNT;
  onClose?: () => void;
};

export default function AccountPanelView({
  account,
  mode = SP_COIN_DISPLAY.ACTIVE_ACCOUNT,
  onClose,
}: AccountPanelViewProps) {
  const swapVisible    = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const rewardsVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);

  if (!account) {
    return (
      <div className="p-4 text-sp-sm text-slate-200">
        <p className="mb-2 font-semibold">No active account selected.</p>
        <p className="m-0">
          Select a <strong>Sponsor</strong>, <strong>Recipient</strong>, or <strong>Agent</strong> to manage.
        </p>
      </div>
    );
  }

  return (
    <div id="ACCOUNT_PANEL" className="flex h-full min-h-0 flex-col">
      <div className={`min-h-0 flex-1 flex flex-col ${rewardsVisible ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {rewardsVisible ? (
          <ManageSponsorshipsPanel onClose={onClose} />
        ) : swapVisible ? (
          <TradingStationPanel />
        ) : (
          <AccountPanelContent
            account={account}
            showHeader={false}
            showSummaryRow={true}
            onClose={onClose}
            mode={mode}
          />
        )}
      </div>
    </div>
  );
}
