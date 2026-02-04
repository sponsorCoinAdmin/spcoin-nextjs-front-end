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
import ManageAgent from '@/components/views/RadioOverlayPanels/ManageAgent';
import ManageRecipient from '@/components/views/RadioOverlayPanels/ManageRecipient';
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

      <ManageSponsorRecipients />

      {/* Top-level overlay panels (radio group) */}
      <PanelGate panel={SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL}>
        <ManageSponsorshipsPanel />
      </PanelGate>

      {/* ───────────────────────── Detail overlays (must be mounted) ───────────────────────── */}
      <PanelGate panel={SP_COIN_DISPLAY.ACCOUNT_PANEL}>
        <AccountPanel />
      </PanelGate>

      <PanelGate panel={SP_COIN_DISPLAY.AGENT_ACCOUNT_PANEL}>
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
      <TokenListSelectPanel />

      <ErrorMessagePanel />
    </>
  );
}
