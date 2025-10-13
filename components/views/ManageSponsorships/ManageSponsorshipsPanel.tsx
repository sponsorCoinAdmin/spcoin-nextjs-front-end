// File: components/views/ManageSponsorships/ManageSponsorshipsPanel.tsx
'use client';

import React, { useEffect, useState } from 'react';
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

  // 'all' = special list view; other modes = show only that module
  const [mode, setMode] = useState<'all' | 'recipients' | 'agents' | 'sponsors'>('all');

  const btn =
    'px-3 py-1.5 text-sm font-medium rounded bg-[#243056] text-[#5981F3] hover:bg-[#5981F3] hover:text-[#0f172a] transition-colors';

  const cell = 'px-3 py-2 text-sm align-middle';
  const th   = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const row  = 'border-b border-slate-800';

  const openOnly = (id: SP_COIN_DISPLAY, nextMode: typeof mode) => {
    try {
      [
        SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL,
        SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL,
        SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL,
      ].forEach((pid) => (pid === id ? openPanel(pid) : closePanel(pid)));
    } catch {}
    setMode(nextMode);
  };

  useEffect(() => {
    if (!isActive) return;
  }, [isActive]);

  if (!isActive) return null;

  // Visibility helpers (modules stay mounted, but hidden when not active)
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

      {/* "All" mode: table with 5 rows x 4 columns.
          Row 1 = header. Rows 2-4 = action buttons in first column.
          Row 5 = placeholder (empty first column, or repurpose later). */}
      {mode === 'all' && (
        <div className="mb-6 overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-900/40">
              <tr className={row}>
                <th scope="col" className={th}>Account</th>
                <th scope="col" className={th}>Staked Coins</th>
                <th scope="col" className={th}>Rewards</th>
                <th scope="col" className={th}>Reconfigure</th>
              </tr>
            </thead>
            <tbody>
              {/* Sponsors */}
              <tr className={row}>
                <td className={cell}>
                  <button
                    type="button"
                    className={btn}
                    onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL, 'sponsors')}
                    aria-label="Open Sponsors panel"
                  >
                    Sponsors
                  </button>
                </td>
                <td className={cell}>0</td>
                <td className={cell}>0</td>
                <td className={cell}></td>
              </tr>

              {/* Agents */}
              <tr className={row}>
                <td className={cell}>
                  <button
                    type="button"
                    className={btn}
                    onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL, 'agents')}
                    aria-label="Open Agents panel"
                  >
                    Agents
                  </button>
                </td>
                <td className={cell}>0</td>
                <td className={cell}>0</td>
                <td className={cell}></td>
              </tr>

              {/* Recipients */}
              <tr className={row}>
                <td className={cell}>
                  <button
                    type="button"
                    className={btn}
                    onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL, 'recipients')}
                    aria-label="Open Recipients panel"
                  >
                    Recipients
                  </button>
                </td>
                <td className={cell}>0</td>
                <td className={cell}>0</td>
                <td className={cell}></td>
              </tr>

              {/* Extra row (placeholder) */}
              <tr className={row}>
                <td className={cell}>
                  Total
                </td>
                <td className={cell}>0</td>
                <td className={cell}>0</td>
                <td className={cell}></td>
              </tr>
            </tbody>
          </table>
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
