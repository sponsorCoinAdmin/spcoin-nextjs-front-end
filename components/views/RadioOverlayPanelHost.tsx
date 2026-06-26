// File: components/views/RadioOverlayPanelHost.tsx
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
import { useEnforceRadioPanelGroups } from '@/lib/context/exchangeContext/hooks/useEnforceRadioPanelGroups';
import { RADIO_PANEL_GROUPS } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';
import WalletAccountsPanel from '@/components/views/RadioOverlayPanels/WalletAccountsPanel';
import WalletNetworksPanel from '@/components/views/RadioOverlayPanels/WalletNetworksPanel';
import WalletConfig from '@/components/views/WalletConfig';
import ManageAccountsPanel from '@/components/wallet/panels/ManageAccountsPanel';
import SponsorPanel from '@/components/views/RadioOverlayPanels/SponsorPanel';
import SendPanel from '@/components/views/RadioOverlayPanels/SendPanel';
import SendRecipientSelectPanel from '@/components/views/RadioOverlayPanels/SendRecipientSelectPanel';

export default function RadioOverlayPanelHost() {
  useEnforceRadioPanelGroups(RADIO_PANEL_GROUPS);

  return (
    <>
      {/* ───────────────────────── Main overlays (radio group) ───────────────────────── */}
      <SponsorPanel />
      <SendPanel />
      <SendRecipientSelectPanel />
      <TradingStationPanel />
      <StakingSpCoinsPanel />
      <ManageSponsorRecipients />

      <PanelGate panel={SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL}>
        <ManageSponsorshipsPanel />
      </PanelGate>

      {/* ───────────────────────── Detail overlays (must be mounted) ───────────────────────── */}
      <PanelGate panel={SP_COIN_DISPLAY.ACCOUNT_PANEL} className="min-h-0 flex-1">
        <AccountPanel />
      </PanelGate>

      <PanelGate panel={SP_COIN_DISPLAY.WALLET_CONFIG_PANEL} className="min-h-0 flex-1">
        <WalletConfig />
      </PanelGate>

      {/* ✅ Token Contract detail overlay (self-gated; must always be mounted) */}
      <TokenPanel />

      {/* ───────────────────────── Select / aux overlays ───────────────────────── */}
      <AgentListSelectPanel />
      <RecipientListSelectPanel />
      <TokenListSelectPanel />

      {/* ───────────────────────── Wallet overlays ───────────────────────── */}
      <WalletAccountsPanel />
      <WalletNetworksPanel />
      <ManageAccountsPanel />

      <ErrorMessagePanel />
    </>
  );
}
