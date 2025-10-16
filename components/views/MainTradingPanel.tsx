// File: components/views/MainTradingPanel.tsx
'use client';

import styles from '@/styles/Exchange.module.css';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import TradingStationPanel from '@/components/views/TradingStationPanel';
import ErrorMessagePanel from '@/components/views/ErrorMessagePanel';
import ManageSponsorshipsPanel from '@/components/views/ManageSponsorships/ManageSponsorshipsPanel';

// Existing manage panels
import ManageRecipients from '@/components/views/ManageSponsorships/ManageRecipients';
import ManageAgents from '@/components/views/ManageSponsorships/ManageAgents';
import ManageSponsors from '@/components/views/ManageSponsorships/ManageSponsors';
// ✅ Add this:
import ManageAgent from '@/components/views/ManageSponsorships/ManageAgent';

import {
  TokenListSelectPanel,
  RecipientListSelectPanel,
  AgentSelectPanel,
} from '@/components/containers/AssetSelectPanels';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';

export default function MainTradingPanel() {
  return (
    <PanelGate panel={SP_COIN_DISPLAY.MAIN_TRADING_PANEL}>
      <div id="MainPage_ID">
        <div id="mainTradingPanel" className={styles.mainTradingPanel}>
          <PanelGate panel={SP_COIN_DISPLAY.TRADE_CONTAINER_HEADER}>
            <TradeContainerHeader />
          </PanelGate>

          <TradingStationPanel />

          {/* Top-level overlay panels (radio group). All must be mounted behind PanelGate. */}
          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL}>
            <ManageSponsorshipsPanel />
          </PanelGate>

          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL}>
            <ManageRecipients />
          </PanelGate>

          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL}>
            <ManageAgents />
          </PanelGate>

          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL}>
            <ManageSponsors />
          </PanelGate>

          {/* ✅ Single-agent detail overlay */}
          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_AGENT_PANEL}>
            <ManageAgent />
          </PanelGate>

          {/* Existing select/aux overlays */}
          <TokenListSelectPanel />
          <RecipientListSelectPanel />
          <AgentSelectPanel />
          <ErrorMessagePanel />
        </div>
      </div>
    </PanelGate>
  );
}
