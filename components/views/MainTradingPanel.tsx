// File: components/views/MainTradingPanel.tsx
'use client';

import React, { useMemo } from 'react';
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
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const SHOW_ACTIVE =
  process.env.NEXT_PUBLIC_SHOW_ACTIVE_OVERLAY === 'true' ||
  process.env.NEXT_PUBLIC_TREE_SHOW_VISIBILITY === 'true';

export default function MainTradingPanel() {
  const { activeMainOverlay } = usePanelTree();

  const activeOverlayLabel = useMemo(() => {
    return activeMainOverlay != null ? SP_COIN_DISPLAY[activeMainOverlay] : 'NONE';
  }, [activeMainOverlay]);

  return (
    <PanelGate panel={SP_COIN_DISPLAY.MAIN_TRADING_PANEL}>
      <div id="MainPage_ID" style={{ position: 'relative' }}>
        {/* 🟢 Debug HUD: current active main overlay */}
        {SHOW_ACTIVE && (
          <div
            id="ActiveOverlayHUD"
            className="pointer-events-none select-none"
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              zIndex: 50,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: 12,
              background: 'rgba(0,0,0,0.6)',
              color: '#9BE28F',
              padding: '6px 8px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
            aria-live="polite"
          >
            activeMainOverlay:&nbsp;<strong>{activeOverlayLabel}</strong>
          </div>
        )}

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
