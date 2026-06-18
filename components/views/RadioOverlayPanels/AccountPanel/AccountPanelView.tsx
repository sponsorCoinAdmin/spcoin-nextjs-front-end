'use client';

import { useState } from 'react';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import {
  readMeritWalletLS,
  updateMeritWalletLS,
  type MeritWalletDefaultPanel,
} from '@/lib/spCoinWallet/meritWalletStorage';
import AccountPanelContent from '@/components/views/RadioOverlayPanels/AccountPanel/AccountPanelContent';
import ManageSponsorshipsPanel from '@/components/views/RadioOverlayPanels/ManageSponsorshipsPanel';
import TradingStationPanel from '@/components/views/TradingStationPanel';
import WalletConfig from '@/components/views/WalletConfig';

type AccountPanelViewProps = {
  account?: spCoinAccount;
  mode?:
    | SP_COIN_DISPLAY.ACTIVE_ACCOUNT
    | SP_COIN_DISPLAY.SPONSOR_ACCOUNT
    | SP_COIN_DISPLAY.RECIPIENT_ACCOUNT
    | SP_COIN_DISPLAY.AGENT_ACCOUNT;
  onClose?: () => void;
  onModalModeChange?: (modal: boolean) => void;
};

export default function AccountPanelView({
  account,
  mode = SP_COIN_DISPLAY.ACTIVE_ACCOUNT,
  onClose,
  onModalModeChange,
}: AccountPanelViewProps) {
  const swapVisible    = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const rewardsVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const optionsVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL);

  const [showBackgroundPage, setShowBackgroundPage] = useState(
    () => readMeritWalletLS().config.showBackgroundPage,
  );
  const [defaultPanel, setDefaultPanel] = useState<MeritWalletDefaultPanel>(
    () => readMeritWalletLS().config.defaultPanel,
  );
  const [modalMode, setModalMode] = useState<boolean>(
    () => readMeritWalletLS().config.modalMode,
  );

  const handleShowBackgroundPageChange = (show: boolean) => {
    setShowBackgroundPage(show);
    updateMeritWalletLS((prev) => ({ ...prev, config: { ...prev.config, showBackgroundPage: show } }));
  };

  const handleDefaultPanelChange = (panel: MeritWalletDefaultPanel) => {
    setDefaultPanel(panel);
    updateMeritWalletLS((prev) => ({ ...prev, config: { ...prev.config, defaultPanel: panel } }));
  };

  const handleModalModeChange = (modal: boolean) => {
    setModalMode(modal);
    onModalModeChange?.(modal);
    updateMeritWalletLS((prev) => ({ ...prev, config: { ...prev.config, modalMode: modal } }));
  };

  if (!account) {
    return (
      <div className="p-4 text-sm text-slate-200">
        <p className="mb-2 font-semibold">No active account selected.</p>
        <p className="m-0">
          Select a <strong>Sponsor</strong>, <strong>Recipient</strong>, or <strong>Agent</strong> to manage.
        </p>
      </div>
    );
  }

  return (
    <div id="ACCOUNT_PANEL" className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {rewardsVisible ? (
          <div className="min-h-0 flex-1 overflow-hidden flex flex-col px-4">
            <ManageSponsorshipsPanel onClose={onClose} />
          </div>
        ) : swapVisible ? (
          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto flex flex-col px-4">
            <TradingStationPanel />
          </div>
        ) : optionsVisible ? (
          <div className="min-h-0 flex-1 overflow-hidden flex flex-col px-4">
            <WalletConfig
              showBackgroundPage={showBackgroundPage}
              onShowBackgroundPageChange={handleShowBackgroundPageChange}
              modalMode={modalMode}
              onModalModeChange={handleModalModeChange}
              defaultPanel={defaultPanel}
              onDefaultPanelChange={handleDefaultPanelChange}
            />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden flex flex-col px-4">
            <AccountPanelContent
              account={account}
              showHeader={false}
              showSummaryRow={true}
              onClose={onClose}
              mode={mode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
