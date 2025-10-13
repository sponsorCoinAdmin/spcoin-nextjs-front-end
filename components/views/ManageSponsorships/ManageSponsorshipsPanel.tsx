// File: components/views/ManageSponsorships/ManageSponsorshipsPanel.tsx
'use client';

import React, { useEffect, useState } from 'react';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import AddressSelect from '@/components/views/AddressSelect';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';

import ManageRecipients from './ManageRecipients';
import ManageSponsors from './ManageSponsors';
import ManageAgents from './ManageAgents';

type Props = { onClose?: () => void };

export default function ManageSponsorshipsPanel({ onClose }: Props) {
  const isActive = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);

  const vRecipients = usePanelVisible(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL);
  const vAgents = usePanelVisible(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL);
  const vSponsors = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL);

  usePanelTransitions();
  const { openPanel, closePanel } = usePanelTree();

  const [mode] = useState<'all' | 'recipients' | 'agents' | 'sponsors'>('all');

  const iconBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded hover:opacity-80 focus:outline-none';

  // Fixed row height (40px)
  const rowH = 'h-[40px]';

  // Inner wrappers handle background + spacing; full height & vertical centering
  const tdInner = `${rowH} w-full px-3 text-sm align-middle flex items-center`;
  const tdInnerCenter = `${tdInner} justify-center`;

  // Alternating row colors on the inner wrappers
  const rowA = 'bg-[rgba(56,78,126,0.35)]';           // Sponsors / Agents
  const rowB = 'bg-[rgba(156,163,175,0.25)]';          // ✅ light grey: Recipients / Total (gray-400 @ 25%)

  const th =
    'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const rowBorder = 'border-b border-slate-800';

  const openOnly = (id: SP_COIN_DISPLAY) => {
    try {
      [
        SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL,
        SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL,
        SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL,
      ].forEach((pid) => (pid === id ? openPanel(pid) : closePanel(pid)));
    } catch {}
  };

  useEffect(() => {
    if (!isActive) return;
  }, [isActive]);

  if (!isActive) return null;

  const recipientsHidden = !(vRecipients && mode === 'recipients');
  const agentsHidden = !(vAgents && mode === 'agents');
  const sponsorsHidden = !(vSponsors && mode === 'sponsors');

  return (
    <>
      {/* Address selector */}
      <div className="mb-6">
        <AssetSelectDisplayProvider>
          <AssetSelectProvider
            containerType={SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL}
            closePanelCallback={() => onClose?.()}
            setSelectedAssetCallback={() => {}}
          >
            <AddressSelect />
          </AssetSelectProvider>
        </AssetSelectDisplayProvider>
      </div>

      {mode === 'all' && (
        <div id="msWrapper" className="mb-6 -mt-[25px] overflow-x-auto rounded-xl border border-black">
          <table id="msTable" className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th scope="col" className={th}>Account</th>
                <th scope="col" className={`${th} text-center`}>Staked Coins</th>
                <th scope="col" className={`${th} text-center`}>Pending Coins</th>
                <th scope="col" className={`${th} text-center`}>Rewards</th>
                <th scope="col" className={`${th} text-center`}>Config</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Sponsors (A) */}
              <tr className={`${rowBorder}`}>
                <td className="p-0"><div className={`${rowA} ${tdInner}`}>Sponsors</div></td>
                <td className="p-0"><div className={`${rowA} ${tdInnerCenter}`}>0</div></td>
                <td className="p-0"><div className={`${rowA} ${tdInnerCenter}`}>0</div></td>
                <td className="p-0">
                  <div className={`${rowA} ${tdInnerCenter}`}>
                    <button type="button" className="ms-claim--orange" aria-label="Claim Sponsors rewards">Claim</button>
                  </div>
                </td>
                <td className="p-0">
                  <div className={`${rowA} ${tdInnerCenter}`}>
                    <button
                      type="button"
                      className={iconBtn}
                      onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL)}
                      aria-label="Open Sponsors reconfigure"
                      title="Reconfigure Sponsors"
                    >
                      <span className="cog-white-mask cog-rot" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 2: Recipients (B) — light grey */}
              <tr className={`${rowBorder}`}>
                <td className="p-0"><div className={`${rowB} ${tdInner}`}>Recipients</div></td>
                <td className="p-0"><div className={`${rowB} ${tdInnerCenter}`}>0</div></td>
                <td className="p-0"><div className={`${rowB} ${tdInnerCenter}`}>0</div></td>
                <td className="p-0">
                  <div className={`${rowB} ${tdInnerCenter}`}>
                    <button type="button" className="ms-claim--green" aria-label="Claim Recipients rewards">Claim</button>
                  </div>
                </td>
                <td className="p-0">
                  <div className={`${rowB} ${tdInnerCenter}`}>
                    <button
                      type="button"
                      className={iconBtn}
                      onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL)}
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
                <td className="p-0"><div className={`${rowA} ${tdInner}`}>Agents</div></td>
                <td className="p-0"><div className={`${rowA} ${tdInnerCenter}`}>0</div></td>
                <td className="p-0"><div className={`${rowA} ${tdInnerCenter}`}>0</div></td>
                <td className="p-0">
                  <div className={`${rowA} ${tdInnerCenter}`}>
                    <button type="button" className="ms-claim--orange" aria-label="Claim Agents rewards">Claim</button>
                  </div>
                </td>
                <td className="p-0">
                  <div className={`${rowA} ${tdInnerCenter}`}>
                    <button
                      type="button"
                      className={iconBtn}
                      onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL)}
                      aria-label="Open Agents reconfigure"
                      title="Reconfigure Agents"
                    >
                      <span className="cog-white-mask cog-rot" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 4: Total (B, light grey, no cog) */}
              <tr className={`${rowBorder}`}>
                <td className="p-0"><div className={`${rowB} ${tdInner}`}>Total</div></td>
                <td className="p-0"><div className={`${rowB} ${tdInnerCenter}`}>0</div></td>
                <td className="p-0"><div className={`${rowB} ${tdInnerCenter}`}>0</div></td>
                <td className="p-0">
                  <div className={`${rowB} ${tdInnerCenter}`}>
                    <button type="button" className="ms-claim--green" aria-label="Claim Total rewards">Claim</button>
                  </div>
                </td>
                <td className="p-0"><div className={`${rowB} ${tdInnerCenter}`} /></td>
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
    </>
  );
}
