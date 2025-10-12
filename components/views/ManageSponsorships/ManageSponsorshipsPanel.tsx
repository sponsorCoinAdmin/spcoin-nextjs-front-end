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

  const [mode, setMode] = useState<'all' | 'recipients' | 'agents' | 'sponsors'>('all');
  const anyPanelVisible = vRecipients || vAgents || vSponsors;

  const showRecipients = vRecipients || (!anyPanelVisible && (mode === 'all' || mode === 'recipients'));
  const showAgents = vAgents || (!anyPanelVisible && (mode === 'all' || mode === 'agents'));
  const showSponsors = vSponsors || (!anyPanelVisible && (mode === 'all' || mode === 'sponsors'));

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
  const openAll = () => {
    try {
      openPanel(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL);
      openPanel(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL);
      openPanel(SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL);
    } catch {}
    setMode('all');
  };

  useEffect(() => {
    if (!anyPanelVisible) {
      // Using local fallback visibility; wire subpanels into defaults to drive globally.
      // console.info('[ManageSponsorshipsPanel] Local fallback visibility active.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isActive) return null;

  return (
    <>
      {/* Button bar */}
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

      {showRecipients && <ManageRecipients />}
      {showSponsors && <ManageSponsors />}
      {showAgents && <ManageAgents />}
    </>
  );
}
