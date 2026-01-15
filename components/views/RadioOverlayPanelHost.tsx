// File: @/components/views/RadioOverlayPanelHost.tsx
'use client';

import React from 'react';

import PanelGate from '@/components/utility/PanelGate';

import {
  AgentListSelectPanel,
  RecipientListSelectPanel,
  SponsorListSelectPanel_OLD,
  TokenListSelectPanel,
} from '@/components/views/AssetSelectPanels';

import { ErrorMessagePanel } from '@/components/views';

import ManageAgent from '@/components/views/RadioOverlayPanels/ManageAgent';
import ManageAgents from '@/components/views/RadioOverlayPanels/ManageAgents';
import ManageRecipient from '@/components/views/RadioOverlayPanels/ManageRecipient';
import ManageRecipients from '@/components/views/RadioOverlayPanels/ManageRecipients';
import ManageSponsor from '@/components/views/RadioOverlayPanels/ManageSponsor';
import ManageSponsorRecipients from '@/components/views/RadioOverlayPanels/SponsorListSelectPanel';
import ManageSponsorshipsPanel from '@/components/views/RadioOverlayPanels/ManageSponsorshipsPanel';
import StakingSpCoins from '@/components/views/RadioOverlayPanels/StakingSpCoinsPanel';

import TradingStationPanel from '@/components/views/TradingStationPanel';

import { SP_COIN_DISPLAY } from '@/lib/structure';

export default function RadioOverlayPanelHost() {
  return (
    <>
      {/* ───────────────────────── Main overlays (radio group) ───────────────────────── */}
      {/* Main trading station (TRADING_STATION_PANEL) */}
      <TradingStationPanel />

      {/* Manage Trading spCoins overlay (STAKING_SPCOINS_PANEL) */}
      <StakingSpCoins />

      {/* ✅ Merged list overlay:
          - SPONSOR_LIST_SELECT_PANEL (claim)
          - UNSTAKING_SPCOINS_PANEL (unstake)
          Component gates itself by visibility of either panel.
      */}
      <ManageSponsorRecipients />

      {/* Top-level overlay panels (radio group) */}
      <PanelGate panel={SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL}>
        <ManageSponsorshipsPanel />
      </PanelGate>

      {/* ───────────────────────── List overlays ───────────────────────── */}
      <PanelGate panel={SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL}>
        <ManageAgents />
      </PanelGate>

      <PanelGate panel={SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL}>
        <ManageRecipients />
      </PanelGate>

      {/* ───────────────────────── Detail overlays (must be mounted) ───────────────────────── */}
      <PanelGate panel={SP_COIN_DISPLAY.AGENT_PANEL}>
        <ManageAgent />
      </PanelGate>

      <PanelGate panel={SP_COIN_DISPLAY.RECIPIENT_ACCOUNT_PANEL}>
        <ManageRecipient />
      </PanelGate>

      <PanelGate panel={SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL}>
        <ManageSponsor />
      </PanelGate>

      {/* ───────────────────────── Select / aux overlays ───────────────────────── */}
      <AgentListSelectPanel />
      <RecipientListSelectPanel />
      <SponsorListSelectPanel_OLD />
      <TokenListSelectPanel />

      <ErrorMessagePanel />
    </>
  );
}
