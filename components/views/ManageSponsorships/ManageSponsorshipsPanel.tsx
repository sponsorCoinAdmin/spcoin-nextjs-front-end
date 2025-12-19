// File: @/components/views/ManageSponsorships/ManageSponsorshipsPanel.tsx
'use client';

import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import { AccountType, SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import AddressSelect from '@/components/views/AddressSelect';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';

import ManageRecipients from './ManageRecipients';
import ManageAgents from './ManageAgents';
import ManageSponsorRecipients from './ManageSponsorRecipients';

// ✅ ToDo overlay
import ToDo from '@/lib/utils/components/ToDo';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORSHIPS === 'true';
const debugLog = createDebugLogger(
  'ManageSponsorshipsPanel',
  DEBUG_ENABLED,
  LOG_TIME,
);

type Props = { onClose?: () => void };

type ToDoMode =
  | 'claimRewards'
  | 'claimAllSponsorshipRewards'
  | 'unstakeAllSponsorships';

export default function ManageSponsorshipsPanel({ onClose }: Props) {
  // ⬇️ All hooks must be called unconditionally (before any early returns)
  const isActive = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const vRecipients = usePanelVisible(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL);
  const vAgents = usePanelVisible(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL);
  const vSponsors = usePanelVisible(
    SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL,
  );

  // ✅ Visibility for Pending Rewards is driven by MANAGE_PENDING_REWARDS panel
  const pendingVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);

  usePanelTransitions();
  const { openPanel, closePanel } = usePanelTree();

  const [showToDo, setShowToDo] = useState<boolean>(false);

  // Exchange context (must not be after an early return)
  const ctx = useContext(ExchangeContextState);
  const activeAccount = ctx?.exchangeContext?.accounts?.activeAccount;

  // ⬇️ Pull connected address for AddressSelect default (falls back to empty string)
  const defaultAddr = String(activeAccount?.address ?? '');

  // 🔍 Log what we actually see at runtime
  useEffect(() => {
    debugLog.log?.('[render]', {
      isActive,
      hasActive: !!activeAccount,
      activeAddress: activeAccount?.address,
      defaultAddr,
      pendingVisible,
    });
  }, [isActive, activeAccount, defaultAddr, pendingVisible]);

  // 🔒 Keep latest selected account type for the ToDo alert across renders
  const accountTypeRef = useRef<AccountType | 'ALL' | ''>('');

  // 🔒 Track which ToDo scenario we are showing
  const todoModeRef = useRef<ToDoMode>('claimRewards');

  // Open only the requested *list* panel; close the alternative list panels
  const openOnly = useCallback(
    (id: SP_COIN_DISPLAY) => {
      try {
        const ids = [
          SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL,
          SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL,
          SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL,
        ] as const;

        ids.forEach((pid) => {
          if (pid === id) {
            debugLog.log?.('openOnly → open', { target: SP_COIN_DISPLAY[pid] });
            openPanel(
              pid,
              'ManageSponsorshipsPanel:openOnly(target=' +
                SP_COIN_DISPLAY[id] +
                '#' +
                String(id) +
                ')',
            );
          } else {
            closePanel(
              pid,
              'ManageSponsorshipsPanel:openOnly(close=' +
                SP_COIN_DISPLAY[pid] +
                '#' +
                String(pid) +
                ')',
            );
          }
        });
      } catch (err) {
        debugLog.warn?.('openOnly error (panel tree not ready?)', { err });
      }
    },
    [openPanel, closePanel],
  );

  // ✅ Open a MAIN_OVERLAY_GROUP panel (Trading / Staking spCoins etc.)
  const openMainOverlay = useCallback(
    (id: SP_COIN_DISPLAY) => {
      try {
        debugLog.log?.('openMainOverlay', { target: SP_COIN_DISPLAY[id] });
        openPanel(
          id,
          'ManageSponsorshipsPanel:openMainOverlay(target=' +
            SP_COIN_DISPLAY[id] +
            '#' +
            String(id) +
            ')',
        );
      } catch (err) {
        debugLog.warn?.('openMainOverlay error', { err });
      }
    },
    [openPanel],
  );

  /** Toggle Pending Rewards rows (the 3 bulleted rows under Pending Rewards) */
  const togglePendingRewards = useCallback(() => {
    if (pendingVisible) {
      closePanel(
        SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
        'ManageSponsorshipsPanel:togglePendingRewards(close)',
      );
    } else {
      // NOTE: MANAGE_SPONSORSHIPS_PANEL stays open; MANAGE_PENDING_REWARDS is not a radio panel.
      openPanel(
        SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
        'ManageSponsorshipsPanel:togglePendingRewards(open)',
      );
    }
  }, [pendingVisible, openPanel, closePanel]);

  /**
   * Claim All button → ToDo (must behave like Sponsors row Claim)
   * BUT with a custom message.
   */
  const claimAllToDo = useCallback(() => {
    todoModeRef.current = 'claimAllSponsorshipRewards';
    setShowToDo(true);
    accountTypeRef.current = 'ALL';
  }, []);

  /** Alert-only placeholder per request (used for per-type Claim buttons) */
  const claimRewards = useCallback((actType: AccountType) => {
    todoModeRef.current = 'claimRewards';
    setShowToDo(true);
    accountTypeRef.current = actType;
  }, []);

  /** Unstake All Sponsorships ToDo (used by the Unstake button on Staked row) */
  const unstakeAllSponsorships = useCallback(() => {
    todoModeRef.current = 'unstakeAllSponsorships';
    setShowToDo(true);

    // This flow isn't per-account-type, but keeping this aligned avoids stale refs.
    accountTypeRef.current = AccountType.SPONSOR;
  }, []);

  const doToDo = useCallback(() => {
    setShowToDo(false);

    const connected = ctx?.exchangeContext?.accounts?.activeAccount;

    // eslint-disable-next-line no-alert
    if (todoModeRef.current === 'unstakeAllSponsorships') {
      let msg: string = 'ToDo: (Not Yet Implemented)\n';
      msg += 'Unstake All Sponsorships :\n';
      msg += `For account: ${connected ? connected.address : '(none connected)'}`;
      alert(msg);
      return;
    }

    // eslint-disable-next-line no-alert
    if (todoModeRef.current === 'claimAllSponsorshipRewards') {
      let msg: string = 'ToDo: (Not Yet Implemented)\n';
      msg += 'Claim all Sponsorship Rewards\n';
      msg += `For Account: ${connected ? connected.address : '(none connected)'}`;
      alert(msg);
      return;
    }

    // Default: Claim Rewards (existing behavior)
    const sel = String(accountTypeRef.current);
    let msg: string = 'ToDo: (Not Yet Implemented)\n';
    msg += 'Claim: ';
    msg += sel === 'ALL' ? sel : `${sel}(s)`;
    msg += ' Rewards\n';
    msg += `For account: ${connected ? connected.address : '(none connected)'}`;
    // eslint-disable-next-line no-alert
    alert(msg);
  }, [ctx?.exchangeContext?.accounts?.activeAccount]);

  // ✅ Early return happens only after all hooks have been called
  if (!isActive) return null;

  // Visibility flags for sub-panels (driven purely by panel-tree visibility)
  const recipientsHidden = !vRecipients;
  const agentsHidden = !vAgents;
  const sponsorsHidden = !vSponsors;

  // ✅ IMPORTANT:
  // Table 1 is ALWAYS visible.
  // Pending Rewards toggles the 3 bulleted rows.
  const showSummaryTable = true;

  // UI classes
  const rowH = 'h-[40px]';
  const tdInner = rowH + ' w-full px-3 text-sm align-middle flex items-center';
  const tdInnerCenter = tdInner + ' justify-center';
  const rowA = 'bg-[rgba(56,78,126,0.35)]'; // Sponsors / Agents / Pending
  const rowB = 'bg-[rgba(156,163,175,0.25)]'; // Recipients / Total
  const th =
    'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const rowBorder = 'border-b border-slate-800';

  return (
    <div id="MANAGE_SPONSORSHIPS_PANEL">
      {/* Address selector */}
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

      {/* MAIN SUMMARY TABLES (Coins / Rewards overview) */}
      <>
        {/* TABLE 1: Coins / amounts (ALWAYS visible) */}
        {showSummaryTable && (
          <div
            id="MANAGE_SPONSORSHIPS_TABLE"
            className="msWrapper mb-6 -mt-[25px] overflow-x-auto rounded-xl border border-black"
          >
            <table className="msTable min-w-full border-collapse">
              {/* TABLE 1 HEADER */}
              <thead>
                <tr className="border-b border-black">
                  <th scope="col" className={th}>
                    SpCoins
                  </th>
                  <th scope="col" className={th + ' text-center'}>
                    Amount
                  </th>
                  <th scope="col" className={th + ' text-center'}>
                    OPTIONS
                  </th>
                </tr>
              </thead>

              {/* TABLE 1 BODY */}
              <tbody>
                {/* Row 1: Trading */}
                <tr className={rowBorder}>
                  <td className="p-0">
                    <div className={rowA + ' ' + tdInner}>Trading</div>
                  </td>
                  <td className="p-0">
                    <div className={rowA + ' ' + tdInnerCenter}>0</div>
                  </td>
                  <td className="p-0">
                    <div className={rowA + ' ' + tdInnerCenter}>
                      <button
                        type="button"
                        className="ms-claim--orange"
                        onClick={() =>
                          openMainOverlay(SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL)
                        }
                        aria-label="Open Trading Coins config"
                        title="Configure Trading Coins"
                      >
                        Stake
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 2: Staked Sponsored Coins */}
                <tr className={rowBorder}>
                  <td className="p-0">
                    {/* ✅ Make the *text* behave like the Unstake button, while keeping row background */}
                    <button
                      type="button"
                      className={rowB + ' ' + tdInner + ' ms-link-cell'}
                      onClick={() =>
                        openMainOverlay(SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL)
                      }
                      aria-label="Open Un-Staking SpCoins panel"
                      title="Open Un-Staking"
                    >
                      Staked
                    </button>
                  </td>
                  <td className="p-0">
                    <div className={rowB + ' ' + tdInnerCenter}>0</div>
                  </td>
                  <td className="p-0">
                    <div className={rowB + ' ' + tdInnerCenter}>
                      <button
                        type="button"
                        className="ms-claim--green"
                        onClick={unstakeAllSponsorships}
                        aria-label="Unstake All Sponsorships (ToDo)"
                        title="Unstake All Sponsorships (ToDo)"
                      >
                        Unstake
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 3: Pending Rewards */}
                <tr className={rowBorder}>
                  <td className="p-0">
                    <button
                      type="button"
                      className={rowA + ' ' + tdInner + ' ms-link-cell'}
                      onClick={togglePendingRewards}
                      aria-label="Toggle Pending Rewards rows"
                    >
                      Pending
                    </button>
                  </td>

                  {/* Amount: hidden when bulleted rows are open */}
                  <td className="p-0">
                    <div className={rowA + ' ' + tdInnerCenter}>
                      {pendingVisible ? '' : 0}
                    </div>
                  </td>

                  {/* Options: Claim All hidden when bulleted rows are open */}
                  <td className="p-0">
                    <div className={rowA + ' ' + tdInnerCenter}>
                      {!pendingVisible && (
                        <button
                          type="button"
                          className="ms-claim--green"
                          aria-label="Claim all Sponsorship rewards (ToDo)"
                          onClick={claimAllToDo}
                        >
                          Claim All
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Row 4–6: Sponsors / Recipients / Agents (ONLY when Pending rows are shown) */}
                {pendingVisible && (
                  <>
                    {/* Row 4: Sponsors */}
                    <tr className={rowBorder}>
                      <td className="p-0">
                        <button
                          type="button"
                          className={rowB + ' ' + tdInner + ' ms-link-cell'}
                          onClick={() =>
                            openOnly(
                              SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL,
                            )
                          }
                          aria-label="Open Claim Sponsors Rewards panel"
                        >
                          <span className="mr-1">&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                          Sponsors
                        </button>
                      </td>
                      <td className="p-0">
                        <div className={rowB + ' ' + tdInnerCenter}>0</div>
                      </td>
                      <td className="p-0">
                        <div className={rowB + ' ' + tdInnerCenter}>
                          <button
                            type="button"
                            className="ms-claim--orange"
                            aria-label="Claim Sponsors rewards"
                            onClick={() => claimRewards(AccountType.SPONSOR)}
                          >
                            Claim
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Row 5: Recipients */}
                    <tr className={rowBorder}>
                      <td className="p-0">
                        <button
                          type="button"
                          className={rowA + ' ' + tdInner + ' ms-link-cell'}
                          onClick={() =>
                            openOnly(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL)
                          }
                          aria-label="Open Claim Recipients Rewards panel"
                        >
                          <span className="mr-1">&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                          Recipients
                        </button>
                      </td>
                      <td className="p-0">
                        <div className={rowA + ' ' + tdInnerCenter}>0</div>
                      </td>
                      <td className="p-0">
                        <div className={rowA + ' ' + tdInnerCenter}>
                          <button
                            type="button"
                            className="ms-claim--green"
                            aria-label="Claim Recipients rewards"
                            onClick={() => claimRewards(AccountType.RECIPIENT)}
                          >
                            Claim
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Row 6: Agents */}
                    <tr className={rowBorder}>
                      <td className="p-0">
                        <button
                          type="button"
                          className={rowB + ' ' + tdInner + ' ms-link-cell'}
                          onClick={() =>
                            openOnly(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL)
                          }
                          aria-label="Open Claim Agents Rewards panel"
                        >
                          <span className="mr-1">&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                          Agents
                        </button>
                      </td>
                      <td className="p-0">
                        <div className={rowB + ' ' + tdInnerCenter}>0</div>
                      </td>
                      <td className="p-0">
                        <div className={rowB + ' ' + tdInnerCenter}>
                          <button
                            type="button"
                            className="ms-claim--orange"
                            aria-label="Claim Agents rewards"
                            onClick={() => claimRewards(AccountType.AGENT)}
                          >
                            Claim
                          </button>
                        </div>
                      </td>
                    </tr>
                  </>
                )}

                {/* Row 7: Total Coins (invert when pending rows are open) */}
                <tr className={rowBorder}>
                  <td className="p-0">
                    <div className={(pendingVisible ? rowA : rowB) + ' ' + tdInner}>
                      Total Coins
                    </div>
                  </td>
                  <td className="p-0">
                    <div
                      className={(pendingVisible ? rowA : rowB) + ' ' + tdInnerCenter}
                    >
                      0
                    </div>
                  </td>
                  <td className="p-0">
                    <div
                      className={(pendingVisible ? rowA : rowB) + ' ' + tdInnerCenter}
                    >
                      {' '}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <style jsx>{`
          .msWrapper {
            border-color: #000 !important;
            margin-top: -18px !important;
          }
          .msTable {
            border-collapse: collapse;
          }
          .msTable thead tr,
          .msTable thead th {
            background-color: #2b2b2b !important;
          }
          .msTable thead tr {
            border-bottom: 1px solid #000 !important;
          }
          .msTable tbody td {
            padding: 0 !important;
          }

          /* First & last column widths fixed across all tables */
          .msTable th:first-child,
          .msTable td:first-child {
            width: 160px;
          }
          .msTable th:last-child,
          .msTable td:last-child {
            width: 90px;
          }

          /* Clickable label cells */
          .msTable .ms-link-cell {
            border: none;
            width: 100%;
            text-align: left;
            display: flex;
            align-items: center;
            padding: 0 0.75rem;
            font: inherit;
            color: inherit;
            cursor: pointer;
          }
          .msTable .ms-link-cell:hover {
            color: #ec8840ff; /* orange hover text */
          }

          /* Base size + layout for ALL claim/stake/unstake buttons */
          .msTable .ms-claim--orange,
          .msTable .ms-claim--green {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 76px;
            height: 32px;
            padding: 0 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 0.375rem;
            transition: background-color 0.2s ease, color 0.2s ease;
            box-sizing: border-box;
            white-space: nowrap;
          }

          /* ORANGE claim / stake buttons */
          .msTable .ms-claim--orange {
            background-color: #ec8840ff !important;
            color: #0f172a !important;
          }
          .msTable .ms-claim--orange:hover {
            background-color: #c7610fff !important;
            color: #ffffff !important;
          }

          /* GREEN claim / unstake buttons */
          .msTable .ms-claim--green {
            background-color: #147f3bff !important;
            color: #ffffff !important;
          }
          .msTable .ms-claim--green:hover {
            background-color: #22c55e !important;
            color: #0f172a !important;
          }

          /* White cog via PNG mask (still here if you reuse later) */
          .msTable .cog-white-mask {
            display: inline-block;
            width: 20px;
            height: 20px;
            background-color: #ffffff;
            -webkit-mask-image: url(${cog_png.src});
            mask-image: url(${cog_png.src});
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-size: contain;
            mask-size: contain;
          }
          .msTable .cog-rot {
            transition: transform 0.3s ease;
          }
          .msTable .cog-rot:hover {
            transform: rotate(360deg);
          }
        `}</style>
      </>

      {/* Keep sub-modules mounted; switch visibility with CSS to preserve Suspense tree */}
      <div className={sponsorsHidden ? 'hidden' : ''}>
        <ManageSponsorRecipients />
      </div>
      <div className={agentsHidden ? 'hidden' : ''}>
        <ManageAgents />
      </div>
      <div className={recipientsHidden ? 'hidden' : ''}>
        <ManageRecipients />
      </div>

      {/* 🔴 ToDo overlay (click the red text to dismiss) */}
      {showToDo && (
        <ToDo
          show
          message="ToDo"
          opacity={0.5}
          color="#ff1a1a"
          zIndex={2000}
          onDismiss={() => doToDo()}
        />
      )}
    </div>
  );
}
