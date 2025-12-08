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
    });
  }, [isActive, activeAccount, defaultAddr]);

  // 🔒 Keep latest selected account type for the ToDo alert across renders
  const accountTypeRef = useRef<AccountType | 'ALL' | ''>('');

  // Open only the requested panel; close the alternatives
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

  /** Alert-only placeholder per request */
  const claimRewards = useCallback((actType: AccountType) => {
    setShowToDo(true);
    accountTypeRef.current = actType;
  }, []);

  const configTrading = useCallback(() => {
    setShowToDo(true);
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
  const rowA = 'bg-[rgba(56,78,126,0.35)]'; // Sponsors / Agents
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
              callingParent={'ManageSponsorshipsPanel'}
              defaultAddress={defaultAddr}
              bypassDefaultFsm
              useActiveAddr={true}
              shortAddr={true}
              preText={'Deposit Account:'}
            />
          </AssetSelectProvider>
        </AssetSelectDisplayProvider>
      </div>
      
      {mode === 'all' && (
        <>
          {/* TABLE 1 CONTAINER: Coins / amounts */}
          <div className="msWrapper mb-6 -mt-[25px] overflow-x-auto rounded-xl border border-black">
            <table className="msTable min-w-full border-collapse">
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
              <tbody>
                {/* Row 1: Trading */}
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInner}`}>Trading Coins</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>0</div>
                  </td>
                  {/* Config column: cog */}
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() =>
                          openOnly(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL)
                        }
                        aria-label="Open Sponsors reconfigure"
                        title="Reconfigure Sponsors"
                      >
                        <span className="cog-white-mask cog-rot" aria-hidden />
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
                  {/* Config column: cog */}
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() =>
                          openOnly(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL)
                        }
                        aria-label="Open Recipients reconfigure"
                        title="Reconfigure Recipients"
                      >
                        <span className="cog-white-mask cog-rot" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 3: Total Coins ( Net ) */}
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowA} ${tdInner}`}>Total Coins ( Net )</div>
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

          {/* TABLE 2 CONTAINER: Rewards breakdown (Claim + Config) */}
          <div className="msWrapper mb-6 overflow-x-auto rounded-xl border border-black">
            <table className="msTable min-w-full border-collapse">
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
                  {/* Rewards: Claim button */}
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
                  {/* Config: cog → MANAGE_SPONSORS_PANEL */}
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() =>
                          openOnly(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL)
                        }
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
                  {/* Rewards: Claim button */}
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
                  {/* Config: cog → MANAGE_RECIPIENTS_PANEL */}
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() =>
                          openOnly(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL)
                        }
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
                  {/* Rewards: Claim button */}
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
                  {/* Config: cog → MANAGE_AGENTS_PANEL */}
                  <td className="p-0">
                    <div className={`${rowA} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() =>
                          openOnly(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL)
                        }
                        aria-label="Open Agents reconfigure"
                        title="Reconfigure Agents"
                      >
                        <span className="cog-white-mask cog-rot" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 4: Total (Config uses ToDo for now) */}
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInner}`}>Total Rewards</div>
                  </td>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>0</div>
                  </td>
                  {/* Rewards: Claim All */}
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
                  {/* Config: cog triggers ToDo configTrading */}
                  <td className="p-0">
                    <div className={`${rowB} ${tdInnerCenter}`}>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() => configTrading()}
                        aria-label="Open Total Rewards ToDo"
                        title="Total Rewards ToDo"
                      >
                        <span className="cog-white-mask cog-rot" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TABLE 3 CONTAINER: Total Coins ( Gross ) only, no header */}
          <div className="msWrapper mb-6 overflow-x-auto rounded-xl border border-black">
            <table className="msTable min-w-full border-collapse">
              <tbody>
                <tr className={`${rowBorder}`}>
                  <td className="p-0">
                    <div className={`${rowB} ${tdInner}`}>Total Coins ( Gross )</div>
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

            /* ORANGE claim buttons */
            .msTable .ms-claim--orange {
              background-color: #ec8840ff !important;
              color: #0f172a !important;
              padding: 0.375rem 0.75rem;
              font-size: 0.875rem;
              font-weight: 500;
              border-radius: 0.375rem;
              transition: background-color 0.2s ease;
            }
            .msTable .ms-claim--orange:hover {
              background-color: #c7610fff !important;
              color: #ffffff !important;
            }

            /* GREEN claim buttons */
            .msTable .ms-claim--green {
              background-color: #147f3bff !important;
              color: #ffffff !important;
              padding: 0.375rem 0.75rem;
              font-size: 0.875rem;
              font-weight: 500;
              border-radius: 0.375rem;
              transition: background-color 0.2s ease;
            }
            .msTable .ms-claim--green:hover {
              background-color: #22c55e !important;
              color: #0f172a !important;
            }

            /* White cog via PNG mask */
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
