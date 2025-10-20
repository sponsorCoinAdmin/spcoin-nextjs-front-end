// File: components/views/MainTradingPanel.tsx
'use client';

import styles from '@/styles/Exchange.module.css';

import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import TradingStationPanel from '@/components/views/TradingStationPanel';
import ErrorMessagePanel from '@/components/views/ErrorMessagePanel';
import ManageSponsorshipsPanel from '@/components/views/ManageSponsorships/ManageSponsorshipsPanel';

// List panels
import ManageRecipients from '@/components/views/ManageSponsorships/ManageRecipients';
import ManageAgents from '@/components/views/ManageSponsorships/ManageAgents';
import ManageSponsors from '@/components/views/ManageSponsorships/ManageSponsors';

// Detail panels (must be mounted for openPanel to work)
import ManageAgent from '@/components/views/ManageSponsorships/ManageAgent';
import ManageRecipient from '@/components/views/ManageSponsorships/ManageRecipient';
import ManageSponsor from '@/components/views/ManageSponsorships/ManageSponsor';

import {
  TokenListSelectPanel,
  RecipientListSelectPanel,
  AgentSelectPanel,
  // If you have a SponsorListSelectPanel, import and render it here too.
  // SponsorListSelectPanel,
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

          {/* Top-level overlay panels (radio group) */}
          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL}>
            <ManageSponsorshipsPanel />
          </PanelGate>

          {/* List views */}
          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL}>
            <ManageRecipients />
          </PanelGate>
          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL}>
            <ManageAgents />
          </PanelGate>
          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL}>
            <ManageSponsors />
          </PanelGate>

          {/* Detail views — these were missing */}
          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_AGENT_PANEL}>
            <ManageAgent />
          </PanelGate>
          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL}>
            <ManageRecipient />
          </PanelGate>
          <PanelGate panel={SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL}>
            <ManageSponsor />
          </PanelGate>

          {/* Select / aux overlays */}
          <TokenListSelectPanel />
          <RecipientListSelectPanel />
          <AgentSelectPanel />
          {/* If you have a dedicated SponsorListSelectPanel, render it too */}
          {/* <SponsorListSelectPanel /> */}

          <ErrorMessagePanel />
        </div>
      </div>
    </PanelGate>
  );
}
