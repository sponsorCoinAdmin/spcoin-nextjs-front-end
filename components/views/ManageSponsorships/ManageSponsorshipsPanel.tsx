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

  // modes: 'all' = special list view (no modules shown), otherwise show only chosen module
  const [mode, setMode] = useState<'all' | 'recipients' | 'agents' | 'sponsors'>('all');

  // Show modules ONLY when their specific mode is active AND visible in global state
  const showRecipients = vRecipients && mode === 'recipients';
  const showAgents = vAgents && mode === 'agents';
  const showSponsors = vSponsors && mode === 'sponsors';

  const btn =
    'px-3 py-1.5 text-sm font-medium rounded bg-[#243056] text-[#5981F3] hover:bg-[#5981F3] hover:text-[#0f172a] transition-colors';

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

  // "All" behavior: close all subpanels and render the 3-row button list
  const openAll = () => {
    try {
      closePanel(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL);
      closePanel(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL);
      closePanel(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL);
    } catch {}
    setMode('all');
  };

  useEffect(() => {
    // optional safety to ensure container is open
    // openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isActive) return null;

  return (
    <>
      {/* Button bar (radio-like) */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <button className={btn} onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL, 'recipients')}>
          Recipients
        </button>
        <button className={btn} onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL, 'agents')}>
          Agents
        </button>
        <button className={btn} onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL, 'sponsors')}>
          Sponsors
        </button>
        <button className={btn} onClick={openAll}>All</button>
      </div>

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

      {/* "All" mode: show three rows of buttons with SAME style & behavior */}
      {mode === 'all' && (
        <div className="space-y-3 mb-6">
          <div>
            <button
              type="button"
              className={btn}
              onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL, 'sponsors')}
              aria-label="Open Sponsors panel"
            >
              Sponsors
            </button>
          </div>
          <div>
            <button
              type="button"
              className={btn}
              onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL, 'agents')}
              aria-label="Open Agents panel"
            >
              Agents
            </button>
          </div>
          <div>
            <button
              type="button"
              className={btn}
              onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL, 'recipients')}
              aria-label="Open Recipients panel"
            >
              Recipients
            </button>
          </div>
        </div>
      )}

      {/* Show modules ONLY when their specific mode is active */}
      {showRecipients && <ManageRecipients />}
      {showSponsors && <ManageSponsors />}
      {showAgents && <ManageAgents />}
    </>
  );
}
