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
import ManageSponsors from './ManageSponsors';
import ManageAgents from './ManageAgents';

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

export default function ManageSponsorshipsPanel({ onClose }: Props) {
  // ⬇️ All hooks must be called unconditionally (before any early returns)
  const isActive = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const vRecipients = usePanelVisible(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL);
  const vAgents = usePanelVisible(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL);
  const vSponsors = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL);

  // ✅ Visibility for Pending Rewards is driven by MANAGE_PENDING_REWARDS panel
  const pendingVisible = usePanelVisible(
    SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
  );

  usePanelTransitions();
  const { openPanel, closePanel } = usePanelTree();

  const [mode] = useState<'all' | 'recipients' | 'agents' | 'sponsors'>('all');
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

  // Open only the requested *list* panel; close the alternative list panels
  const openOnly = useCallback(
    (id: SP_COIN_DISPLAY) => {
      try {
        const ids = [
          SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL,
          SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL,
          SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL,
        ] as const;

        ids.forEach((pid) => {
          if (pid === id) {
            debugLog.log?.('openOnly → open', { target: SP_COIN_DISPLAY[pid] });
            openPanel(
              pid,
              `ManageSponsorshipsPanel:openOnly(target=${SP_COIN_DISPLAY[id]}#${id})`,
            );
          } else {
            closePanel(
              pid,
              `ManageSponsorshipsPanel:openOnly(close=${SP_COIN_DISPLAY[pid]}#${pid})`,
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
          `ManageSponsorshipsPanel:openMainOverlay(target=${SP_COIN_DISPLAY[id]}#${id})`,
        );
      } catch (err) {
        debugLog.warn?.('openMainOverlay error', { err });
      }
    },
    [openPanel],
  );

  /** Toggle Pending Rewards detail rows (Reward Type / Sponsors / Recipients / Agents) */
  const togglePendingRewards = useCallback(() => {
    if (pendingVisible) {
      closePanel(
        SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
        'ManageSponsorshipsPanel:togglePendingRewards(close)',
      );
    } else {
      openPanel(
        SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
        'ManageSponsorshipsPanel:togglePendingRewards(open)',
      );
    }
  }, [pendingVisible, openPanel, closePanel]);

  /** Alert-only placeholder per request */
  const claimRewards = useCallback((actType: AccountType) => {
    setShowToDo(true);
    accountTypeRef.current = actType;
  }, []);

  const doToDo = useCallback(() => {
    setShowToDo(false);
    const connected = ctx?.exchangeContext?.accounts?.activeAccount;
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

  // Visibility flags for sub-panels
  const recipientsHidden = !(vRecipients && mode === 'recipients');
  const agentsHidden = !(vAgents && mode === 'agents');
  const sponsorsHidden = !(vSponsors && mode === 'sponsors');

  // UI classes
  const iconBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded hover:opacity-80 focus:outline-none';
  const rowH = 'h-[40px]';
  const tdInner = `${rowH} w-full px-3 text-sm align-middle flex items-center`;
  const tdInnerCenter = `${tdInner} justify-center`;
  const rowA = 'bg-[rgba(56,78,126,0.35)]'; // Sponsors / Agents / Pending / Reward Type
  const rowB = 'bg-[rgba(156,163,175,0.25)]'; // Recipients / Total
  const th =
    'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const rowBorder = 'border-b border-slate-800';

  return (
    <>
      {/* Address selector */}
      <div className="mb-[1.375rem]">
        <AssetSelectDisplayProvider>
          {/* AGENT_LIST_SELECT_PANEL removed; scope to MANAGE_SPONSORSHIPS_PANEL */}
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

      {mode === 'all' && (
        <>
          {/* TABLE 1 CONTAINER: Coins / amounts */}
          <div className="msWrapper mb-6 -mt-[25px] overflow-x-auto rounded-xl border border-black">
            <table className="msTable min-w-full border-collapse">
              {/* TABLE 1 HEADER */}
              <thead>
                <tr className="border-b border-black">
                  <th scope="col" className={th}>
                    Sponsor Coins
                  </th>
                  <th scope="col" className={`${th} text-center`}>
                    Amount
                  </th>
                  <th scope="col" className={`${th} text-center`}>
                    CONFIG
                  </th>
                </tr>
              </thead>

              {/* TABLE 1 BODY */}
              <tbody>
                {/* Row 1: Trading */}
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInner}`}>Trading Coins</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>0</div>
                  </td>
                  {/* Config column: Stake button */}
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className="ms-claim--orange"
                        onClick={() =>
                          openMainOverlay(
                            SP_COIN_DISPLAY.MANAGE_STAKING_SPCOINS_PANEL,
                          )
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
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInner}`}>Staked Coins</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>0</div>
                  </td>
                  {/* Config column: Unstake button */}
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className="ms-claim--green"
                        onClick={() =>
                          openMainOverlay(
                            SP_COIN_DISPLAY.MANAGE_TRADING_SPCOINS_PANEL,
                          )
                        }
                        aria-label="Open Staked Coins config"
                        title="Configure Staked Coins"
                      >
                        Unstake
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 3: Total Coins (Net) */}
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInner}`}>Total Coins (Net)</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>0</div>
                  </td>
                  {/* Config column: empty for now */}
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}> </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TABLE 2 CONTAINER: Staked Rewards */}
          <div className="msWrapper mb-6 overflow-x-auto rounded-xl border border-black">
            <table className="msTable min-w-full border-collapse">
              {/* TABLE 2 HEADER: Staked Rewards */}
              <thead>
                <tr className="border-b border-black">
                  <th scope="col" className={th}>
                    Staked Rewards
                  </th>
                  <th scope="col" className={`${th} text-center`}>
                    Pending Coins
                  </th>
                  <th scope="col" className={`${th} text-center`}>
                    Rewards
                  </th>
                </tr>
              </thead>

              {/* TABLE 2 BODY: Pending + detail rows */}
              <tbody>
                {/* Detail rows only visible when toggle is "on" */}
                {pendingVisible && (
                  <>
                    {/* Row 0: Reward Type (A) — now also toggles MANAGE_PENDING_REWARDS */}
                    <tr className={`${rowBorder}`}>
                      <td className="p-0">
                        <button
                          type="button"
                          className={`${rowA} ${tdInner} ms-link-cell`}
                          onClick={togglePendingRewards}
                          aria-label="Toggle Pending Rewards details from Reward Type"
                        >
                          Reward Type
                        </button>
                      </td>
                      <td className="p-0">
                        <div className={`${rowA} ${tdInnerCenter}`}></div>
                      </td>
                      <td className="p-0">
                        <div className={`${rowA} ${tdInnerCenter}`}></div>
                      </td>
                    </tr>

                    {/* Row 1: Sponsors (B) — with bullet indent */}
                    <tr className={`${rowBorder}`}>
                      <td className="p-0">
                        <button
                          type="button"
                          className={`${rowB} ${tdInner} ms-link-cell`}
                          onClick={() =>
                            openOnly(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL)
                          }
                          aria-label="Open Claim Sponsors Rewards panel"
                        >
                          <span className="mr-1">
                            &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;
                          </span>
                          Sponsors
                        </button>
                      </td>
                      <td className="p-0">
                        <div className={`${rowB} ${tdInnerCenter}`}>0</div>
                      </td>
                      {/* Rewards: Claim button */}
                      <td className="p-0">
                        <div className={`${rowB} ${tdInnerCenter}`}>
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

                    {/* Row 2: Recipients (A) */}
                    <tr className={`${rowBorder}`}>
                      <td className="p-0">
                        <button
                          type="button"
                          className={`${rowA} ${tdInner} ms-link-cell`}
                          onClick={() =>
                            openOnly(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL)
                          }
                          aria-label="Open Claim Recipients Rewards panel"
                        >
                          <span className="mr-1">
                            &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;
                          </span>
                          Recipients
                        </button>
                      </td>
                      <td className="p-0">
                        <div className={`${rowA} ${tdInnerCenter}`}>0</div>
                      </td>
                      {/* Rewards: Claim button */}
                      <td className="p-0">
                        <div className={`${rowA} ${tdInnerCenter}`}>
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

                    {/* Row 3: Agents (B) */}
                    <tr className={`${rowBorder}`}>
                      <td className="p-0">
                        <button
                          type="button"
                          className={`${rowB} ${tdInner} ms-link-cell`}
                          onClick={() =>
                            openOnly(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL)
                          }
                          aria-label="Open Claim Agents Rewards panel"
                        >
                          <span className="mr-1">
                            &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;
                          </span>
                          Agents
                        </button>
                      </td>
                      <td className="p-0">
                        <div className={`${rowB} ${tdInnerCenter}`}>0</div>
                      </td>
                      {/* Rewards: Claim button */}
                      <td className="p-0">
                        <div className={`${rowB} ${tdInnerCenter}`}>
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

                {/* Row: Pending Rewards (always visible; toggles detail rows) */}
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <button
                      type="button"
                      className={`${rowA} ${tdInner} ms-link-cell`}
                      onClick={togglePendingRewards}
                      aria-label="Toggle Pending Rewards details"
                    >
                      Pending Rewards
                    </button>
                  </td>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>0</div>
                  </td>
                  {/* Rewards: Claim All */}
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className="ms-claim--green"
                        aria-label="Claim Total rewards"
                        onClick={() => claimRewards(AccountType.ALL)}
                      >
                        Claim
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TABLE 3 CONTAINER: Total Coins (Gross) only, no header */}
          <div className="msWrapper mb-6 overflow-x-auto rounded-xl border border-black">
            <table className="msTable min-w-full border-collapse">
              <tbody>
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInner}`}>Total Coins (Gross)</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>0</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>
                      {/* numeric placeholder + ToDo config trigger */}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

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

            /* Clickable label cells (Sponsors / Recipients / Agents / Pending Rewards / Reward Type) */
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
              min-width: 76px;       /* ⬅️ was 96px – narrower overall */
              height: 32px;
              padding: 0 0.375rem;   /* ⬅️ half the horizontal padding */
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
      )}

      {/* Keep modules mounted; switch visibility with CSS to preserve Suspense tree */}
      <div className={sponsorsHidden ? 'hidden' : ''}>
        <ManageSponsors />
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
    </>
  );
}
