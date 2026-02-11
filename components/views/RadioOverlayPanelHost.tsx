// File: @/components/views/RadioOverlayPanelHost.tsx
'use client';

import React from 'react';

import PanelGate from '@/components/utility/PanelGate';

import {
  AgentListSelectPanel,
  RecipientListSelectPanel,
  TokenListSelectPanel,
} from '@/components/views/AssetSelectPanels';

import { ErrorMessagePanel } from '@/components/views';

import AccountPanel from '@/components/views/RadioOverlayPanels/AccountPanel';
import TokenPanel from '@/components/views/RadioOverlayPanels/TokenPanel'; // ✅ add this

import ManageSponsorRecipients from '@/components/views/RadioOverlayPanels/ListSelectPanels/SponsorListSelectPanel';
import ManageSponsorshipsPanel from '@/components/views/RadioOverlayPanels/ManageSponsorshipsPanel';
import StakingSpCoinsPanel from '@/components/views/RadioOverlayPanels/StakingSpCoinsPanel';

import TradingStationPanel from '@/components/views/TradingStationPanel';

import { SP_COIN_DISPLAY } from '@/lib/structure';

export default function RadioOverlayPanelHost() {
  return (
    <>
      {/* ───────────────────────── Main overlays (radio group) ───────────────────────── */}
      <TradingStationPanel />
      <StakingSpCoinsPanel />
      <ManageSponsorRecipients />

      <PanelGate panel={SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL}>
        <ManageSponsorshipsPanel />
      </PanelGate>

      {/* ───────────────────────── Detail overlays (must be mounted) ───────────────────────── */}
      <PanelGate panel={SP_COIN_DISPLAY.ACCOUNT_PANEL}>
        <AccountPanel />
      </PanelGate>

      {/* ✅ Token Contract detail overlay (self-gated; must always be mounted) */}
      <TokenPanel />

      {/* ───────────────────────── Select / aux overlays ───────────────────────── */}
      <AgentListSelectPanel />
      <RecipientListSelectPanel />
      <TokenListSelectPanel />

      <ErrorMessagePanel />
    </>
  );
}
