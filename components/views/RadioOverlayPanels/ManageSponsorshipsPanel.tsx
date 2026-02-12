// File: @/components/views/ManageSponsorships/ManageSponsorshipsPanel.tsx
'use client';

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
// import { ChevronDown, ChevronUp } from 'lucide-react';

import { AccountType, SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import AddressSelect from '@/components/views/AssetSelectPanels/AddressSelect';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';

import ToDo from '@/lib/utils/components/ToDo';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { msTableTw } from './msTableTw';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORSHIPS === 'true';
const debugLog = createDebugLogger('ManageSponsorshipsPanel', DEBUG_ENABLED, LOG_TIME);

type Props = { onClose?: () => void };

// ✅ fixed left column width ONLY (others flex)
const COL_0_WIDTH = '105px';

// ✅ Rewards modes supported by this panel
type RewardsMode =
  | SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS
  | SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS
  | SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS
  | SP_COIN_DISPLAY.PENDING_AGENT_REWARDS;

type ToDoMode = 'claimRewards' | 'claimAllSponsorshipRewards' | 'unstakeAllSponsorships';

export default function ManageSponsorshipsPanel({ onClose }: Props) {
  const ctx = useContext(ExchangeContextState);
  const activeAccount = ctx?.exchangeContext?.accounts?.activeAccount;

  const isActive = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const pendingVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);

  const { openPanel, closePanel } = usePanelTree();

  const defaultAddr = useMemo(() => String(activeAccount?.address ?? ''), [activeAccount?.address]);

  useEffect(() => {
    debugLog.log?.('[render]', {
      isActive,
      hasActive: !!activeAccount,
      activeAddress: activeAccount?.address,
      defaultAddr,
      pendingVisible,
    });
  }, [isActive, activeAccount, defaultAddr, pendingVisible]);

  // ───────────────────────── ToDo overlay (inlined; replaces deleted hook) ─────────────────────────
  const [showToDo, setShowToDo] = useState(false);
  const todoModeRef = useRef<ToDoMode>('claimRewards');
  const accountTypeRef = useRef<AccountType | 'ALL' | ''>('');

  const claimRewards = useCallback((actType: AccountType) => {
    todoModeRef.current = 'claimRewards';
    accountTypeRef.current = actType;
    setShowToDo(true);
  }, []);

  const claimAllToDo = useCallback(() => {
    todoModeRef.current = 'claimAllSponsorshipRewards';
    accountTypeRef.current = 'ALL';
    setShowToDo(true);
  }, []);

  const unstakeAllSponsorships = useCallback(() => {
    todoModeRef.current = 'unstakeAllSponsorships';
    accountTypeRef.current = AccountType.SPONSOR;
    setShowToDo(true);
  }, []);

  const doToDo = useCallback(() => {
    setShowToDo(false);

    const connected = ctx?.exchangeContext?.accounts?.activeAccount;
    const connectedAddr = connected ? String((connected as any)?.address ?? '') : '(none connected)';

    // eslint-disable-next-line no-alert
    if (todoModeRef.current === 'unstakeAllSponsorships') {
      alert(`ToDo: (Not Yet Implemented)\nUnstake All Sponsorships:\nFor account: ${connectedAddr}`);
      return;
    }

    // eslint-disable-next-line no-alert
    if (todoModeRef.current === 'claimAllSponsorshipRewards') {
      alert(`ToDo: (Not Yet Implemented)\nClaim all Sponsorship Rewards\nFor Account: ${connectedAddr}`);
      return;
    }

    // Default: Claim Rewards
    const sel = String(accountTypeRef.current);
    const what = sel === 'ALL' ? sel : `${sel}(s)`;
    // eslint-disable-next-line no-alert
    alert(`ToDo: (Not Yet Implemented)\nClaim: ${what} Rewards\nFor account: ${connectedAddr}`);
  }, [ctx]);

  const openOverlay = useCallback(
    (id: SP_COIN_DISPLAY) => {
      debugLog.log?.('openOverlay', { target: SP_COIN_DISPLAY[id] });
      openPanel(id, `ManageSponsorshipsPanel:openOverlay(target=${SP_COIN_DISPLAY[id]}#${String(id)})`);
    },
    [openPanel],
  );

  /**
   * ✅ Rewards mode switching (inlined; replaces rewardsTreeActions.openRewardsModeWithPanels)
   * Opens ACCOUNT_LIST_REWARDS_PANEL, then opens the selected rewards subpanel
   * while closing the others so only one mode is active.
   */
  const openRewardsMode = useCallback(
    (mode: RewardsMode) => {
      debugLog.log?.('openRewardsMode', { mode: SP_COIN_DISPLAY[mode] });

      const reasonPrefix = 'ManageSponsorshipsPanel:openRewardsMode';
      const reason = (msg: string) => `${reasonPrefix}:${msg}`;

      // 1) Ensure the rewards "parent" panel is open
      openPanel(SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL, reason('open(ACCOUNT_LIST_REWARDS_PANEL)'));

      // 2) Close all reward sub-panels first (so only one mode is active)
      const allModes: RewardsMode[] = [
        SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS,
        SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS,
        SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS,
        SP_COIN_DISPLAY.PENDING_AGENT_REWARDS,
      ];

      for (const m of allModes) {
        if (m !== mode) {
          closePanel(m, reason(`close(${SP_COIN_DISPLAY[m]})`));
        }
      }

      // 3) Open the selected mode
      openPanel(mode, reason(`open(${SP_COIN_DISPLAY[mode]})`));

      // 4) If choosing a pending mode, ensure the "Pending Rewards by Account Type" group is expanded
      const isPendingMode =
        mode === SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS ||
        mode === SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS ||
        mode === SP_COIN_DISPLAY.PENDING_AGENT_REWARDS;

      if (isPendingMode && !pendingVisible) {
        openPanel(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS, reason('open(MANAGE_PENDING_REWARDS)'));
      }
    },
    [openPanel, closePanel, pendingVisible],
  );

  /**
   * Pending row opens the group (and the Pending row disappears).
   */
  const onOpenRewardsByAccountType = useCallback(() => {
    if (!pendingVisible) {
      openPanel(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS, 'ManageSponsorshipsPanel:onOpenRewardsByAccountType(open)');
    }
  }, [pendingVisible, openPanel]);

  /**
   * Pending Rewards by Account Type row closes the group (and Pending row reappears).
   */
  const onCloseRewardsByAccountType = useCallback(() => {
    if (pendingVisible) {
      closePanel(
        SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
        'ManageSponsorshipsPanel:onCloseRewardsByAccountType(close)',
      );
    }
  }, [pendingVisible, closePanel]);

  if (!isActive) return null;

  const showSummaryTable = true;
  const col1NoWrap = 'whitespace-nowrap';

  // ✅ ensures Staked/Pending buttons align exactly like Trading's tdInner5
  const leftAlignedLinkBtn = 'block w-full text-left m-0 p-0';

  // ✅ removed vertical white column lines
  const vLine = '';

  // ✅ left-aligned amount content (0.0)
  const amountLeft = 'w-full flex items-center justify-start';

  // ✅ enforce col0 width everywhere it matters
  const col0Style: React.CSSProperties = { width: COL_0_WIDTH, minWidth: COL_0_WIDTH, maxWidth: COL_0_WIDTH };

  /**
   * Pending + group header share same styling
   */
  const pendingRowBg = msTableTw.rowA;
  const pendingCellTw = `${pendingRowBg} ${msTableTw.td5} ${vLine}`;
  const pendingTextTw = 'text-white';
  const pendingBtnTw = `${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap} ${leftAlignedLinkBtn} ${pendingTextTw}`;

  return (
    <div id="MANAGE_SPONSORSHIPS_PANEL">
      {pendingVisible && (
        <div id="MANAGE_PENDING_REWARDS" className="hidden" aria-hidden="true" />
      )}
      <div className="mb-0">
        <AssetSelectDisplayProvider>
          <AssetSelectProvider
            containerType={SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL}
            closePanelCallback={() => onClose?.()}
            setSelectedAssetCallback={() => {}}
          >
            <AddressSelect
              callingParent="ManageSponsorshipsPanel"
              defaultAddress={defaultAddr}
              bypassDefaultFsm
              useActiveAddr
              shortAddr
              preText="Deposit Account:"
            />
          </AssetSelectProvider>
        </AssetSelectDisplayProvider>
      </div>

      {showSummaryTable && (
        <div className={`${msTableTw.wrapper} !mt-0 mt-0 mt-3 mb-0 max-h-[45vh] md:max-h-[59vh] overflow-x-auto overflow-y-auto`}>
          <table id="MANAGE_SPONSORSHIPS_TABLE" className={`${msTableTw.table} table-fixed min-w-full`}>
            <colgroup>
              <col style={{ width: COL_0_WIDTH }} />
              <col />
              <col />
            </colgroup>

            <thead>
              <tr className={msTableTw.theadRow}>
                <th scope="col" style={col0Style} className={`${msTableTw.th5} ${msTableTw.th5Pad3} ${vLine}`}>
                  SpCoins
                </th>

                <th scope="col" className={`${msTableTw.th} ${msTableTw.thPad3} text-center ${vLine}`}>
                  Amount
                </th>

                <th scope="col" className={`${msTableTw.th5} ${msTableTw.th5Pad3} text-center ${msTableTw.colFit}`}>
                  Options
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Trading */}
              <tr className={msTableTw.rowBorder}>
                <td style={col0Style} className={`${msTableTw.rowA} ${msTableTw.td5} ${vLine}`}>
                  <div className={`${msTableTw.tdInner5} ${col1NoWrap}`} title="SpCoins Available for Staking/Trading">
                    Trading
                  </div>
                </td>

                <td className={`${msTableTw.rowA} ${msTableTw.td} ${vLine}`}>
                  <div className={amountLeft}>0.0</div>
                </td>

                <td className={`${msTableTw.rowA} ${msTableTw.td5}`}>
                  <div className={msTableTw.tdInnerCenter5}>
                    <button
                      type="button"
                      className={msTableTw.btnOrange}
                      onClick={() => openOverlay(SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL)}
                      aria-label="Open Trading Coins config"
                      title="Stake New Sponsorships"
                    >
                      Stake
                    </button>
                  </div>
                </td>
              </tr>

              {/* Staked */}
              <tr className={msTableTw.rowBorder}>
                <td style={col0Style} className={`${msTableTw.rowB} ${msTableTw.td5} ${vLine}`}>
                  <button
                    type="button"
                    className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap} ${leftAlignedLinkBtn}`}
                    onClick={() => openRewardsMode(SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS)}
                    aria-label="Open Staked list"
                    title="Manage SpCoin Staking Contracts."
                  >
                    Staked
                  </button>
                </td>

                <td className={`${msTableTw.rowB} ${msTableTw.td} ${vLine}`}>
                  <div className={amountLeft}>0.0</div>
                </td>

                <td className={`${msTableTw.rowB} ${msTableTw.td5}`}>
                  <div className={msTableTw.tdInnerCenter5}>
                    <button
                      type="button"
                      className={msTableTw.btnGreen}
                      onClick={unstakeAllSponsorships}
                      aria-label="Unstake All Sponsorships"
                      title="Unstake All Sponsorships"
                    >
                      Unstake
                    </button>
                  </div>
                </td>
              </tr>

              {/* Pending row (shown ONLY when group is CLOSED) */}
              {!pendingVisible && (
                <tr className={msTableTw.rowBorder}>
                  <td style={col0Style} className={pendingCellTw}>
                    <button
                      type="button"
                      className={pendingBtnTw}
                      onClick={onOpenRewardsByAccountType}
                      aria-label="Open Pending Rewards by Account Type"
                      title="Open Pending Rewards by Account Type"
                    >
                      Pending
                    </button>
                  </td>

                  <td className={`${pendingRowBg} ${msTableTw.td} ${vLine}`}>
                    <div className={amountLeft}>0.0</div>
                  </td>

                  <td className={`${pendingRowBg} ${msTableTw.td5}`}>
                    <div className={msTableTw.tdInnerCenter5}>
                      <button
                        type="button"
                        className={msTableTw.btnGreen}
                        aria-label="Claim all Sponsorship rewards"
                        onClick={claimAllToDo}
                        title="Claim all Pending Rewards"
                      >
                        Claim All
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Pending Rewards by Account Type row (shown ONLY when group is OPEN) */}
              {pendingVisible && (
                <tr className={msTableTw.rowBorder}>
                  <td style={col0Style} className={pendingCellTw}>
                    <button
                      type="button"
                      className={pendingBtnTw}
                      onClick={onCloseRewardsByAccountType}
                      aria-label="Close Pending Rewards by Account Type"
                      title="Close Pending Rewards by Account Type"
                    >
                      Pending Rewards by Account Type
                    </button>
                  </td>

                  <td className={`${pendingRowBg} ${msTableTw.td} ${vLine}`}>
                    <div className={amountLeft} />
                  </td>

                  <td className={`${pendingRowBg} ${msTableTw.td5}`}>
                    <div className={msTableTw.tdInnerCenter5} />
                  </td>
                </tr>
              )}

              {/* Sponsor/Recipient/Agent group rows (shown ONLY when group is OPEN) */}
              {pendingVisible && (
                <>
                  {/* Sponsors */}
                  <tr className={msTableTw.rowBorder}>
                    <td style={col0Style} className={`${msTableTw.rowB} ${msTableTw.td5} ${vLine}`}>
                      <button
                        type="button"
                        className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap}`}
                        onClick={() => openRewardsMode(SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS)}
                        aria-label="Open Claim Sponsors Rewards panel"
                        title="Available Sponsor Rewards"
                      >
                        <span className="mr-1">&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                        Sponsor
                      </button>
                    </td>

                    <td className={`${msTableTw.rowB} ${msTableTw.td} ${vLine}`}>
                      <div className={amountLeft}>0.0</div>
                    </td>

                    <td className={`${msTableTw.rowB} ${msTableTw.td5}`}>
                      <div className={msTableTw.tdInnerCenter5}>
                        <button
                          type="button"
                          className={msTableTw.btnOrange}
                          aria-label="Claim Sponsors rewards"
                          onClick={() => claimRewards(AccountType.SPONSOR)}
                          title="Claim all Sponsor Account Rewards"
                        >
                          Claim All
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Recipients */}
                  <tr className={msTableTw.rowBorder}>
                    <td style={col0Style} className={`${msTableTw.rowA} ${msTableTw.td5} ${vLine}`}>
                      <button
                        type="button"
                        className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap}`}
                        onClick={() => openRewardsMode(SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS)}
                        aria-label="Open Claim Recipients Rewards panel"
                        title="Available Recipient Rewards"
                      >
                        <span className="mr-1">&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                        Recipient
                      </button>
                    </td>

                    <td className={`${msTableTw.rowA} ${msTableTw.td} ${vLine}`}>
                      <div className={amountLeft}>0.0</div>
                    </td>

                    <td className={`${msTableTw.rowA} ${msTableTw.td5}`}>
                      <div className={msTableTw.tdInnerCenter5}>
                        <button
                          type="button"
                          className={msTableTw.btnGreen}
                          aria-label="Claim Recipients rewards"
                          onClick={() => claimRewards(AccountType.RECIPIENT)}
                          title="Claim all Recipient Account Rewards"
                        >
                          Claim All
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Agent */}
                  <tr className={msTableTw.rowBorder}>
                    <td style={col0Style} className={`${msTableTw.rowB} ${msTableTw.td5} ${vLine}`}>
                      <button
                        type="button"
                        className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap}`}
                        onClick={() => openRewardsMode(SP_COIN_DISPLAY.PENDING_AGENT_REWARDS)}
                        aria-label="Open Claim Agents Rewards panel"
                        title="Available Agent Rewards"
                      >
                        <span className="mr-1">&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                        Agent
                      </button>
                    </td>

                    <td className={`${msTableTw.rowB} ${msTableTw.td} ${vLine}`}>
                      <div className={amountLeft}>0.0</div>
                    </td>

                    <td className={`${msTableTw.rowB} ${msTableTw.td5}`}>
                      <div className={msTableTw.tdInnerCenter5}>
                        <button
                          type="button"
                          className={msTableTw.btnOrange}
                          aria-label="Claim Agents rewards"
                          onClick={() => claimRewards(AccountType.AGENT)}
                          title="Claim all Agent Account Rewards"
                        >
                          Claim All
                        </button>
                      </div>
                    </td>
                  </tr>
                </>
              )}

              {/* Total (2 columns; col2 spans Amount+Options) */}
              {(() => {
                const zebra = pendingVisible ? msTableTw.rowA : msTableTw.rowB;

                return (
                  <tr className={msTableTw.rowBorder}>
                    <td style={col0Style} className={`${zebra} ${msTableTw.td5} ${vLine}`}>
                      <div className={`${msTableTw.tdInner5} ${col1NoWrap}`} title="Total Available SpCoins">
                        Total Coins
                      </div>
                    </td>

                    <td colSpan={2} className={`${zebra} ${msTableTw.td}`}>
                      <div className={amountLeft}>0.0</div>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}

      {showToDo && (
        <ToDo show message="ToDo" opacity={0.5} color="#ff1a1a" zIndex={2000} onDismiss={() => doToDo()} />
      )}
    </div>
  );
}
