'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, FolderCog, Settings2, UserRoundPlus } from 'lucide-react';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
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

const ACCOUNT_PANEL_TABS = [
  { key: 'ACCOUNT', label: 'Account', icon: UserRoundPlus },
  { key: 'REWARDS', label: 'Rewards', icon: FolderCog },
  { key: 'SWAP', label: 'Swap', icon: ArrowLeftRight },
  { key: 'OPTIONS', label: 'Options', icon: Settings2 },
] as const;

type AccountPanelTab = (typeof ACCOUNT_PANEL_TABS)[number]['key'];

// Maps each tab to the radio-group panel it owns.
const TAB_PANEL: Record<AccountPanelTab, SP_COIN_DISPLAY> = {
  ACCOUNT: SP_COIN_DISPLAY.ACCOUNT_PANEL,
  REWARDS: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
  SWAP:    SP_COIN_DISPLAY.TRADING_STATION_PANEL,
  OPTIONS: SP_COIN_DISPLAY.WALLET_CONFIG_PANEL,
};

type AccountPanelViewProps = {
  account?: spCoinAccount;
  mode?:
    | SP_COIN_DISPLAY.ACTIVE_ACCOUNT
    | SP_COIN_DISPLAY.SPONSOR_ACCOUNT
    | SP_COIN_DISPLAY.RECIPIENT_ACCOUNT
    | SP_COIN_DISPLAY.AGENT_ACCOUNT;
  onClose?: () => void;
  subHeader?: React.ReactNode;
  onModalModeChange?: (modal: boolean) => void;
};

export default function AccountPanelView({
  account,
  mode = SP_COIN_DISPLAY.ACTIVE_ACCOUNT,
  onClose,
  subHeader,
  onModalModeChange,
}: AccountPanelViewProps) {
  const { openPanel } = usePanelTree();
  const swapVisible    = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const rewardsVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const optionsVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_CONFIG_PANEL);

  const [activeTab, setActiveTab] = useState<AccountPanelTab>('ACCOUNT');
  const [showBackgroundPage, setShowBackgroundPage] = useState(
    () => readMeritWalletLS().config.showBackgroundPage,
  );
  const [defaultPanel, setDefaultPanel] = useState<MeritWalletDefaultPanel>(
    () => readMeritWalletLS().config.defaultPanel,
  );
  const [modalMode, setModalMode] = useState<boolean>(
    () => readMeritWalletLS().config.modalMode,
  );

  // Keep activeTab in sync with the radio-group panel that is currently visible.
  useEffect(() => {
    if (swapVisible)    { setActiveTab('SWAP');    return; }
    if (rewardsVisible) { setActiveTab('REWARDS'); return; }
    if (optionsVisible) { setActiveTab('OPTIONS'); return; }
    setActiveTab('ACCOUNT');
  }, [swapVisible, rewardsVisible, optionsVisible]);

  const activeTabConfig = useMemo(
    () => ACCOUNT_PANEL_TABS.find((t) => t.key === activeTab) ?? ACCOUNT_PANEL_TABS[0],
    [activeTab],
  );

  const activateTab = (tab: AccountPanelTab) => {
    setActiveTab(tab);
    // openPanel atomically shows the target and closes all other radio members.
    openPanel(TAB_PANEL[tab], `AccountPanelView:${tab}`);
  };

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

  return (
    <div id="ACCOUNT_PANEL" className="flex h-full min-h-0 flex-col">
      {account ? (
        <>
          <div className="shrink-0 border-b border-slate-700/70 px-4 pt-3">
            <div className="scrollbar-hide flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
              {ACCOUNT_PANEL_TABS.map((tab) => {
                const isActive = tab.key === activeTab;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => activateTab(tab.key)}
                    className={[
                      'inline-flex min-w-[92px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-t-[12px] border px-4 py-2 text-[0.72rem] font-semibold tracking-[0.14em] transition-colors',
                      isActive
                        ? 'border-[#596fe8] bg-[#243056] text-[#9db0ff]'
                        : 'border-slate-700/70 bg-[#11162a] text-slate-300 hover:border-slate-600 hover:bg-[#1a2034]',
                    ].join(' ')}
                    aria-pressed={isActive}
                    title={tab.label}
                  >
                    {tab.key === 'OPTIONS' ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {subHeader}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {activeTabConfig.key === 'ACCOUNT' ? (
              <AccountPanelContent
                account={account}
                showHeader={false}
                showSummaryRow={true}
                onClose={onClose}
                mode={mode}
              />
            ) : null}

            {activeTabConfig.key === 'REWARDS' ? (
              <div className="min-h-0 flex-1 overflow-hidden">
                <ManageSponsorshipsPanel onClose={onClose} />
              </div>
            ) : null}

            {activeTabConfig.key === 'SWAP' ? (
              <div className="min-h-0 flex-1 overflow-hidden">
                <TradingStationPanel />
              </div>
            ) : null}

            {activeTabConfig.key === 'OPTIONS' ? (
              <WalletConfig
                showBackgroundPage={showBackgroundPage}
                onShowBackgroundPageChange={handleShowBackgroundPageChange}
                modalMode={modalMode}
                onModalModeChange={handleModalModeChange}
                defaultPanel={defaultPanel}
                onDefaultPanelChange={handleDefaultPanelChange}
              />
            ) : null}
          </div>
        </>
      ) : (
        <div className="p-4 text-sm text-slate-200">
          <p className="mb-2 font-semibold">No active account selected.</p>
          <p className="m-0">
            Select a <strong>Sponsor</strong>, <strong>Recipient</strong>, or <strong>Agent</strong> to manage.
          </p>
        </div>
      )}
    </div>
  );
}
