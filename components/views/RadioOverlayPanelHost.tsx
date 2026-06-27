'use client';

import React, { useCallback } from 'react';

import PanelGate from '@/components/utility/PanelGate';

import {
  AgentListSelectPanel,
  RecipientListSelectPanel,
  TokenListSelectPanel,
} from '@/components/views/AssetSelectPanels';

import { ErrorMessagePanel } from '@/components/views';

import AccountPanel from '@/components/views/RadioOverlayPanels/AccountPanel';
import TokenPanel from '@/components/views/RadioOverlayPanels/TokenPanel';

import ManageSponsorRecipients from '@/components/views/RadioOverlayPanels/ListSelectPanels/SponsorListSelectPanel';
import ManageSponsorshipsPanel from '@/components/views/RadioOverlayPanels/ManageSponsorshipsPanel';
import StakingSpCoinsPanel from '@/components/views/RadioOverlayPanels/StakingSpCoinsPanel';

import TradingStationPanel from '@/components/views/TradingStationPanel';

import { SP_COIN_DISPLAY, type TokenContract } from '@/lib/structure';
import { useEnforceRadioPanelGroups } from '@/lib/context/exchangeContext/hooks/useEnforceRadioPanelGroups';
import { RADIO_PANEL_GROUPS } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import WalletAccountsPanel from '@/components/views/RadioOverlayPanels/WalletAccountsPanel';
import WalletNetworksPanel from '@/components/views/RadioOverlayPanels/WalletNetworksPanel';
import WalletConfig from '@/components/views/WalletConfig';
import ManageAccountsPanel from '@/components/wallet/panels/ManageAccountsPanel';
import SponsorPanel from '@/components/views/RadioOverlayPanels/SponsorPanel';
import SendPanel from '@/components/views/RadioOverlayPanels/SendPanel';
import SendRecipientSelectPanel from '@/components/views/RadioOverlayPanels/SendRecipientSelectPanel';

export default function RadioOverlayPanelHost() {
  useEnforceRadioPanelGroups(RADIO_PANEL_GROUPS);

  const { commitToken, commitRecipient, commitAgent, commitSponsor, commitSendRecipient } =
    useSelectionCommit();

  const sellMode = usePanelVisible(SP_COIN_DISPLAY.SELL_CONTRACT);
  const sendMode = usePanelVisible(SP_COIN_DISPLAY.SEND_CONTRACT);

  const handleTokenSelect = useCallback(
    (token: TokenContract) => {
      const side = sendMode ? 'send' : sellMode ? 'sell' : 'buy';
      commitToken(token, side);
    },
    [commitToken, sellMode, sendMode],
  );

  return (
    <>
      {/* ───────────────────────── Main overlays (radio group) ───────────────────────── */}
      <SponsorPanel />
      <SendPanel />
      <SendRecipientSelectPanel onSelect={commitSendRecipient} />
      <TradingStationPanel />
      <StakingSpCoinsPanel />
      <ManageSponsorRecipients onSelect={commitSponsor} />

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

      {/* Token Contract detail overlay (self-gated; must always be mounted) */}
      <TokenPanel />

      {/* ───────────────────────── Select / aux overlays ───────────────────────── */}
      <AgentListSelectPanel onSelect={commitAgent} />
      <RecipientListSelectPanel onSelect={commitRecipient} />
      <TokenListSelectPanel onSelect={handleTokenSelect} />

      {/* ───────────────────────── Wallet overlays ───────────────────────── */}
      <WalletAccountsPanel />
      <WalletNetworksPanel />
      <ManageAccountsPanel />

      <ErrorMessagePanel />
    </>
  );
}
