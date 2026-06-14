'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, FolderCog, HandHeart, Settings2, UserRoundPlus } from 'lucide-react';

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
import {
  clearDebugTraceBuffer,
  getDebugTraceBuffer,
  isDebugTraceEnabled,
  setDebugTraceEnabled,
} from '@/lib/utils/debugTrace';

const DEBUG_TRACE_EVENT = 'spcoin-debug-trace-update';

const ACCOUNT_PANEL_TABS = [
  { key: 'ACCOUNT', label: 'Account', icon: UserRoundPlus },
  { key: 'REWARDS', label: 'Rewards', icon: FolderCog },
  { key: 'SWAP', label: 'Swap', icon: ArrowLeftRight },
  { key: 'SPONSOR', label: 'Sponsor', icon: HandHeart },
  { key: 'OPTIONS', label: 'Options', icon: Settings2 },
] as const;

type AccountPanelTab = (typeof ACCOUNT_PANEL_TABS)[number]['key'];

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
  const { setPanelVisible } = usePanelTree();
  const sponsorVisible = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT);
  const recipientVisible = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_ACCOUNT);
  const agentVisible = usePanelVisible(SP_COIN_DISPLAY.AGENT_ACCOUNT);
  const rewardsVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const swapVisible = usePanelVisible(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  const [activeTab, setActiveTab] = useState<AccountPanelTab>('ACCOUNT');
  const [showBackgroundPage, setShowBackgroundPage] = useState(
    () => readMeritWalletLS().config.showBackgroundPage,
  );
  const [defaultPanel, setDefaultPanel] = useState<MeritWalletDefaultPanel>(
    () => readMeritWalletLS().config.defaultPanel,
  );
  const [traceExpanded, setTraceExpanded] = useState(false);
  const [traceEnabled, setTraceEnabledState] = useState<boolean>(() => isDebugTraceEnabled());
  const [traceLines, setTraceLines] = useState<string[]>([]);

  useEffect(() => {
    if (swapVisible) {
      setActiveTab('SWAP');
      return;
    }

    if (rewardsVisible) {
      setActiveTab('REWARDS');
      return;
    }

    if (sponsorVisible || recipientVisible || agentVisible) {
      setActiveTab('SPONSOR');
      return;
    }

    setActiveTab('ACCOUNT');
  }, [agentVisible, recipientVisible, rewardsVisible, sponsorVisible, swapVisible]);

  useEffect(() => {
    setTraceLines(traceEnabled ? getDebugTraceBuffer() : []);

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ buffer?: string[]; enabled?: boolean }>).detail;

      if (typeof detail?.enabled === 'boolean') {
        setTraceEnabledState(detail.enabled);
        if (!detail.enabled) {
          setTraceLines([]);
        } else {
          setTraceLines(getDebugTraceBuffer());
        }
        return;
      }

      if (Array.isArray(detail?.buffer)) {
        setTraceLines(traceEnabled ? detail.buffer : []);
      } else {
        setTraceLines(traceEnabled ? getDebugTraceBuffer() : []);
      }
    };

    window.addEventListener(DEBUG_TRACE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(DEBUG_TRACE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [traceEnabled]);

  const activeTabConfig = useMemo(() => {
    return ACCOUNT_PANEL_TABS.find((tab) => tab.key === activeTab) ?? ACCOUNT_PANEL_TABS[0];
  }, [activeTab]);

  const handleShowBackgroundPageChange = (show: boolean) => {
    setShowBackgroundPage(show);
    updateMeritWalletLS((previous) => ({
      ...previous,
      config: {
        ...previous.config,
        showBackgroundPage: show,
      },
    }));
  };

  const handleDefaultPanelChange = (panel: MeritWalletDefaultPanel) => {
    setDefaultPanel(panel);
    updateMeritWalletLS((previous) => ({
      ...previous,
      config: {
        ...previous.config,
        defaultPanel: panel,
      },
    }));
  };

  const handleToggleTraceEnabled = () => {
    const next = !traceEnabled;
    setTraceEnabledState(next);
    setDebugTraceEnabled(next);

    if (!next) {
      clearDebugTraceBuffer();
      setTraceLines([]);
    } else {
      setTraceLines(getDebugTraceBuffer());
    }
  };

  const activateTab = (tab: AccountPanelTab) => {
    setActiveTab(tab);

    if (tab === 'ACCOUNT') {
      setPanelVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL, true, 'AccountPanelView:setAccountTab');
      setPanelVisible(
        SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
        false,
        'AccountPanelView:hideRewardsForAccountTab',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.TRADING_STATION_PANEL,
        false,
        'AccountPanelView:hideSwapForAccountTab',
      );
      return;
    }

    if (tab === 'REWARDS') {
      setPanelVisible(
        SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
        true,
        'AccountPanelView:setRewardsTab',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.TRADING_STATION_PANEL,
        false,
        'AccountPanelView:hideSwapForRewardsTab',
      );
      return;
    }

    if (tab === 'SWAP') {
      setPanelVisible(
        SP_COIN_DISPLAY.TRADING_STATION_PANEL,
        true,
        'AccountPanelView:setSwapTab',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
        false,
        'AccountPanelView:hideRewardsForSwapTab',
      );
      return;
    }

    if (tab === 'SPONSOR') {
      setPanelVisible(
        SP_COIN_DISPLAY.SPONSOR_ACCOUNT,
        true,
        'AccountPanelView:setSponsorTab',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
        false,
        'AccountPanelView:hideRewardsForSponsorTab',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.TRADING_STATION_PANEL,
        false,
        'AccountPanelView:hideSwapForSponsorTab',
      );
      return;
    }

    if (tab === 'OPTIONS') {
      setPanelVisible(
        SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
        false,
        'AccountPanelView:hideRewardsForOptionsTab',
      );
      setPanelVisible(
        SP_COIN_DISPLAY.TRADING_STATION_PANEL,
        false,
        'AccountPanelView:hideSwapForOptionsTab',
      );
    }
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

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
            {activeTabConfig.key === 'ACCOUNT' ? (
              <AccountPanelContent
                account={account}
                showHeader={false}
                showSummaryRow={true}
                onClose={onClose}
                mode={mode}
              />
            ) : null}

            {activeTabConfig.key === 'SPONSOR' ? (
              <AccountPanelContent
                account={account}
                showHeader={false}
                showSummaryRow={true}
                onClose={onClose}
                mode={SP_COIN_DISPLAY.SPONSOR_ACCOUNT}
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
                defaultPanel={defaultPanel}
                onDefaultPanelChange={handleDefaultPanelChange}
              />
            ) : null}

            <div className="shrink-0 border-t border-slate-700/70 px-4 py-3 font-mono text-[#91a5ff]">
              <div className="flex items-center gap-2 leading-tight">
                <button
                  type="button"
                  onClick={() => setTraceExpanded((current) => !current)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#91a5ff] hover:text-white"
                  aria-expanded={traceExpanded}
                  aria-label={traceExpanded ? 'Collapse trace log' : 'Expand trace log'}
                  title={traceExpanded ? 'Collapse trace log' : 'Expand trace log'}
                >
                  <span className="text-base leading-none">{traceExpanded ? '[-]' : '[+]'}</span>
                  <span>Trace Log</span>
                </button>
                <label className="ml-2 inline-flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-[#91a5ff]">
                  <input
                    type="checkbox"
                    checked={traceEnabled}
                    onChange={handleToggleTraceEnabled}
                    className="h-4 w-4 cursor-pointer accent-[#6f86f7]"
                    aria-label="Enable trace log"
                  />
                  <span>Trace</span>
                </label>
              </div>

              {traceExpanded ? (
                <div className="mt-2 max-h-52 overflow-y-auto scrollbar-hide">
                  {traceEnabled ? (
                    traceLines.length > 0 ? (
                      <div className="space-y-0.5 text-xs leading-5 text-[#c0cbff]">
                        {traceLines.map((line, index) => (
                          <div key={`${index}:${line}`} className="whitespace-pre-wrap break-words">
                            {line}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">No trace entries yet.</div>
                    )
                  ) : (
                    <div className="text-xs text-slate-400">Trace logging is off.</div>
                  )}
                </div>
              ) : null}
            </div>
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
