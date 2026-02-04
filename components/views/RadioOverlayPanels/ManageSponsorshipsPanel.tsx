// File: @/components/views/ManageSponsorships/ManageSponsorshipsPanel.tsx
'use client';

import React, { useCallback, useContext, useEffect, useMemo } from 'react';
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

import { useManageSponsorships } from './AccountPanel/hooks/useManageSponsorships';
import { msTableTw } from './msTableTw';

// ✅ Centralized rewards selection logic (shared with Tree Panel)
import { type RewardsMode, openRewardsModeWithPanels } from '@/lib/structure/exchangeContext/helpers/rewardsTreeActions';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORSHIPS === 'true';
const debugLog = createDebugLogger('ManageSponsorshipsPanel', DEBUG_ENABLED, LOG_TIME);

type Props = { onClose?: () => void };

// ✅ fixed left column width ONLY (others flex)
const COL_0_WIDTH = '105px';

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

  const { showToDo, claimRewards, claimAllToDo, unstakeAllSponsorships, doToDo } = useManageSponsorships(ctx);

  const openOverlay = useCallback(
    (id: SP_COIN_DISPLAY) => {
      debugLog.log?.('openOverlay', { target: SP_COIN_DISPLAY[id] });
      openPanel(id, `ManageSponsorshipsPanel:openOverlay(target=${SP_COIN_DISPLAY[id]}#${String(id)})`);
    },
    [openPanel],
  );

  // ✅ Rewards mode is now PENDING_*_COINS (plus UNSPONSOR_STATE).
  const openRewardsMode = useCallback(
    (mode: RewardsMode) => {
      debugLog.log?.('openRewardsMode', { mode: SP_COIN_DISPLAY[mode] });

      openRewardsModeWithPanels({
        mode,
        openPanel: (id, reason) => openPanel(id as any, reason),
        closePanel: (id, reason) => closePanel(id as any, reason),
        reasonPrefix: 'ManageSponsorshipsPanel:openRewardsMode',
        ensureManagePending: true,
        // Optional: if you have a visibility hook handy later, pass it here to avoid duplicate pushes.
        // isVisible: (id) => usePanelVisible(id) <-- can't call hooks here; keep undefined.
      });
    },
    [openPanel, closePanel],
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
      <div className="mb-[1.375rem]">
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
        <div className={`${msTableTw.wrapper} mb-1`}>
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
                    onClick={() => openRewardsMode(SP_COIN_DISPLAY.UNSPONSOR_STATE)}
                    aria-label="Open Staked list"
                    title="Manage SpCoin Contracts."
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

              {/* Pending Rewards by Account Type row (shown ONLY when group is OPEN)
                  - SAME alignment/styling as Pending row
                  - white text
                  - NO 0.0 and NO Claim All on this row
               */}
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

              {/* Sponsor/Recipient/Apent group rows (shown ONLY when group is OPEN) */}
              {pendingVisible && (
                <>
                  {/* Sponsors */}
                  <tr className={msTableTw.rowBorder}>
                    <td style={col0Style} className={`${msTableTw.rowB} ${msTableTw.td5} ${vLine}`}>
                      <button
                        type="button"
                        className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap}`}
                        onClick={() => openRewardsMode(SP_COIN_DISPLAY.SPONSOR_STATE)}
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
                        onClick={() => openRewardsMode(SP_COIN_DISPLAY.RECIPIENT_STATE)}
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

                  {/* Apent */}
                  <tr className={msTableTw.rowBorder}>
                    <td style={col0Style} className={`${msTableTw.rowB} ${msTableTw.td5} ${vLine}`}>
                      <button
                        type="button"
                        className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap}`}
                        onClick={() => openRewardsMode(SP_COIN_DISPLAY.AGENT_STATE)}
                        aria-label="Open Claim Agents Rewards panel"
                        title="Available Agent Rewards"
                      >
                        <span className="mr-1">&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                        Apent
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
