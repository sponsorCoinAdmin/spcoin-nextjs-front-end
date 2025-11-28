// File: @/components/views/ManageSponsorships/ManageSponsorshipsPanel.tsx
'use client';

import React, { useState, useCallback, useContext, useRef } from 'react';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import { AccountType, SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

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
  LOG_TIME
);

type Props = { onClose?: () => void };

export default function ManageSponsorshipsPanel({ }: Props) {
  // ⬇️ All hooks must be called unconditionally (before any early returns)
  const isActive = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
  const vRecipients = usePanelVisible(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL);
  const vAgents = usePanelVisible(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL);
  const vSponsors = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL);

  usePanelTransitions();
  const { openPanel, closePanel } = usePanelTree();

  // mode is still used for the summary table; it no longer gates nested visibility
  const [mode] = useState<'all' | 'recipients' | 'agents' | 'sponsors'>('all');
  const [showToDo, setShowToDo] = useState<boolean>(false);

  // Exchange context (must not be after an early return)
  const ctx = useContext(ExchangeContextState);

  // 🔒 Keep latest selected account type for the ToDo alert across renders
  const accountTypeRef = useRef<AccountType | 'ALL' | ''>('');

  // 🔍 Render-time trace
  debugLog.log?.('[render]', {
    isActive,
    vRecipients,
    vAgents,
    vSponsors,
    mode,
  });

  // Open only the requested panel; close the alternatives
  const openOnly = useCallback(
    (id: SP_COIN_DISPLAY) => {
      debugLog.log?.('[openOnly] requested', {
        targetId: id,
        targetLabel: SP_COIN_DISPLAY[id],
      });

      try {
        const ids = [
          SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL,
          SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL,
          SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL,
        ] as const;

        ids.forEach((pid) => {
          if (pid === id) {
            debugLog.log?.('[openOnly] open', {
              id: pid,
              label: SP_COIN_DISPLAY[pid],
            });
            openPanel(
              pid,
              `ManageSponsorshipsPanel:openOnly(target=${SP_COIN_DISPLAY[id]}#${id})`
            );
          } else {
            debugLog.log?.('[openOnly] close', {
              id: pid,
              label: SP_COIN_DISPLAY[pid],
            });
            closePanel(
              pid,
              `ManageSponsorshipsPanel:openOnly(close=${SP_COIN_DISPLAY[pid]}#${pid})`
            );
          }
        });
      } catch (err) {
        debugLog.log?.('[openOnly] error (panel tree not ready?)', {
          error: String(err),
        });
      }
    },
    [openPanel, closePanel]
  );

  /** Alert-only placeholder per request */
  const claimRewards = useCallback((actType: AccountType) => {
    debugLog.log?.('[claimRewards] clicked', { actType });
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

    debugLog.log?.('[doToDo] dismiss', {
      sel,
      connected: connected?.address ?? null,
    });

    // eslint-disable-next-line no-alert
    alert(msg);
  }, [ctx?.exchangeContext?.accounts?.activeAccount]);

  // ✅ Early return happens only after all hooks have been called
  if (!isActive) {
    debugLog.log?.('[render] inactive → return null');
    return null;
  }

  // 🔑 Visibility driven purely by panel tree
  const recipientsHidden = !vRecipients;
  const agentsHidden = !vAgents;
  const sponsorsHidden = !vSponsors;

  // UI classes
  const iconBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded hover:opacity-80 focus:outline-none';
  const rowH = 'h-[40px]';
  const tdInner = `${rowH} w-full px-3 text-sm align-middle flex items-center`;
  const tdInnerCenter = `${tdInner} justify-center`;
  const rowA = 'bg-[rgba(56,78,126,0.35)]'; // Sponsors / Agents
  const rowB = 'bg-[rgba(156,163,175,0.25)]'; // Recipients / Total
  const th =
    'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const rowBorder = 'border-b border-slate-800';

  return (
    <>
      {/* Root: bound to overlay cell, so children can use flex-1/min-h-0 */}
      <div
        id="ManageSponsorshipsRoot"
        className="flex flex-col h-full w-full min-h-0 rounded-[15px] overflow-hidden"
      >
        {/* Summary table (fixed height) */}
        {mode === 'all' && (
          <div
            id="msWrapper"
            className="shrink-0 mb-6 -mt-[10px] overflow-x-auto rounded-xl border border-black"
          >
            <table id="msTable" className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th scope="col" className={th}>
                    Account
                  </th>
                  <th scope="col" className={`${th} text-center`}>
                    Staked Coins
                  </th>
                  <th scope="col" className={`${th} text-center`}>
                    Pending Coins
                  </th>
                  <th scope="col" className={`${th} text-center`}>
                    Rewards
                  </th>
                  <th scope="col" className={`${th} text-center`}>
                    Config
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Sponsors (A) */}
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInner}`}>Sponsors</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>0</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>0</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>
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
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() => {
                          debugLog.log?.('[click] Sponsors cog');
                          openOnly(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL);
                        }}
                        aria-label="Open Sponsors reconfigure"
                        title="Reconfigure Sponsors"
                      >
                        <span className="cog-white-mask cog-rot" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 2: Recipients (B) */}
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInner}`}>Recipients</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>0</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>0</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>
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
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() => {
                          debugLog.log?.('[click] Recipients cog');
                          openOnly(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL);
                        }}
                        aria-label="Open Recipients reconfigure"
                        title="Reconfigure Recipients"
                      >
                        <span className="cog-white-mask cog-rot" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 3: Agents (A) */}
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInner}`}>Agents</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>0</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>0</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>
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
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() => {
                          debugLog.log?.('[click] Agents cog');
                          openOnly(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL);
                        }}
                        aria-label="Open Agents reconfigure"
                        title="Reconfigure Agents"
                      >
                        <span className="cog-white-mask cog-rot" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 4: Total (B, no cog) */}
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInner}`}>Total</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>0</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>0</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>
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
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`} />
                  </td>
                </tr>
              </tbody>
            </table>

            <style jsx>{`
              #msWrapper {
                border-color: #000 !important;
                margin-top: -18px !important;
              }
              #msTable thead tr,
              #msTable thead th {
                background-color: #2b2b2b !important;
              }
              #msTable thead tr {
                border-bottom: 1px solid #000 !important;
              }
              #msTable tbody td {
                padding: 0 !important;
              }

              /* ORANGE claim buttons */
              #msTable .ms-claim--orange {
                background-color: #ec8840ff !important;
                color: #0f172a !important;
                padding: 0.375rem 0.75rem;
                font-size: 0.875rem;
                font-weight: 500;
                border-radius: 0.375rem;
                transition: background-color 0.2s ease;
              }
              #msTable .ms-claim--orange:hover {
                background-color: #c7610fff !important;
                color: #ffffff !important;
              }

              /* GREEN claim buttons */
              #msTable .ms-claim--green {
                background-color: #147f3bff !important;
                color: #ffffff !important;
                padding: 0.375rem 0.75rem;
                font-size: 0.875rem;
                font-weight: 500;
                border-radius: 0.375rem;
                transition: background-color 0.2s ease;
              }
              #msTable .ms-claim--green:hover {
                background-color: #22c55e !important;
                color: #0f172a !important;
              }

              /* White cog via PNG mask */
              #msTable .cog-white-mask {
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
              #msTable .cog-rot {
                transition: transform 0.3s ease;
              }
              #msTable .cog-rot:hover {
                transform: rotate(360deg);
              }
            `}</style>
          </div>
        )}

        {/* Nested list panels live in a flex-1 area, bounded by this overlay */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className={sponsorsHidden ? 'hidden h-full' : 'h-full'}>
            <ManageSponsors />
          </div>
          <div className={agentsHidden ? 'hidden h-full' : 'h-full'}>
            <ManageAgents />
          </div>
          <div className={recipientsHidden ? 'hidden h-full' : 'h-full'}>
            <ManageRecipients />
          </div>
        </div>
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
