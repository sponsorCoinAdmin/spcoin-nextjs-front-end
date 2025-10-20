// File: app/(menu)/Test/Tabs/ExchangeContext/index.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { useExpandCollapse } from './hooks/useExpandCollapse';
import { useExchangePageState } from './hooks/useExchangePageState';
import TopBar from './components/TopBar';
import TreeView from './components/Tree/TreeView';
import Row from './components/Tree/Row';
import { enumRegistry } from './state/enumRegistry';
import PriceView from '@/app/(menu)/Exchange/Price';

// Virtual tree builder (page-local)
import { useVirtualPanelTree } from './hooks/useVirtualPanelTree';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

// Panel registry
import PanelGate from '@/components/utility/PanelGate';

// List views
import ManageRecipients from '@/components/views/ManageSponsorships/ManageRecipients';
import ManageAgents from '@/components/views/ManageSponsorships/ManageAgents';
import ManageSponsors from '@/components/views/ManageSponsorships/ManageSponsors';
import ManageSponsorshipsPanel from '@/components/views/ManageSponsorships/ManageSponsorshipsPanel';

// Detail views
import ManageAgent from '@/components/views/ManageSponsorships/ManageAgent';
import ManageRecipient from '@/components/views/ManageSponsorships/ManageRecipient';
import ManageSponsor from '@/components/views/ManageSponsorships/ManageSponsor';

// Select / aux overlays
import {
  TokenListSelectPanel,
  RecipientListSelectPanel,
  AgentSelectPanel,
} from '@/components/containers/AssetSelectPanels';

// Core header/panel components (registered here so they’re visible in the tree)
import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import TradingStationPanel from '@/components/views/TradingStationPanel';

type NamedVirtualNode = {
  id: number;
  visible: boolean;
  children: NamedVirtualNode[];
  name?: string;
};

const PAGES_KEY = 'test_exchangeContext_pages';

function addNamesShallow(nodes: NamedVirtualNode[]): NamedVirtualNode[] {
  return nodes.map((n) => ({
    ...n,
    name: n.name ?? (SP[n.id] ?? String(n.id)),
    children: (n.children ?? []).map((c) => ({
      ...c,
      name: c.name ?? (SP[c.id] ?? String(c.id)),
    })),
  }));
}

type PagesState = { showGui?: boolean; expanded?: boolean; showExchange?: boolean };

function readPagesState(): PagesState {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(PAGES_KEY);
    return raw ? (JSON.parse(raw) as PagesState) : {};
  } catch {
    return {};
  }
}
function writePagesState(patch: PagesState) {
  try {
    const current = readPagesState();
    const next = { ...current, ...patch };
    window.localStorage.setItem(PAGES_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export default function ExchangeContextTab() {
  const { exchangeContext } = useExchangeContext();
  const { expandContext, setExpandContext, hideContext, logContext } = useExchangePageState();
  const { ui, toggleAll, togglePath, restRaw } = useExpandCollapse(exchangeContext, expandContext);

  // Build the virtual (display-only) tree from the builder
  const { tree } = useVirtualPanelTree(exchangeContext);
  const treeWithNames = useMemo<NamedVirtualNode[]>(
    () => addNamesShallow(tree as unknown as NamedVirtualNode[]),
    [tree]
  );

  const [showGui, setShowGui] = useState<boolean>(() => {
    const s = readPagesState();
    return typeof s.showGui === 'boolean' ? s.showGui : true;
  });
  const [showExchange, setShowExchange] = useState<boolean>(() => {
    const s = readPagesState();
    return typeof s.showExchange === 'boolean' ? s.showExchange : true;
  });

  // Restore initial expand state
  useEffect(() => {
    const { expanded } = readPagesState();
    if (typeof expanded === 'boolean') {
      setExpandContext(expanded);
      toggleAll(expanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist UI prefs
  useEffect(() => {
    writePagesState({ showGui, expanded: expandContext, showExchange });
  }, [showGui, expandContext, showExchange]);

  const onToggleShowGui = useCallback(() => setShowGui((prev) => !prev), []);
  const onToggleExchange = useCallback(() => setShowExchange((prev) => !prev), []);
  const onTogglePath = useCallback((path: string) => togglePath(path), [togglePath]);

  const containerClass = useMemo(() => {
    if (!showGui && !showExchange) return 'px-4';
    if (showGui && showExchange) return 'px-4 flex gap-4';
    return 'px-4';
  }, [showGui, showExchange]);

  const leftPaneClass = useMemo(() => {
    if (!showExchange) return 'hidden';
    return showGui ? 'flex-1' : 'w-full';
  }, [showGui, showExchange]);

  const rightPaneClass = useMemo(() => {
    if (!showGui) return 'hidden';
    return showExchange ? 'flex-1 border-l border-slate-700' : 'w-full';
  }, [showGui, showExchange]);

  const settingsObj = useMemo(
    () => ({
      apiTradingProvider: (exchangeContext as any)?.settings?.apiTradingProvider,
      spCoinPanelTree: treeWithNames,
    }),
    [exchangeContext, treeWithNames]
  );

  return (
    <div className="space-y-4">
      <TopBar
        expanded={expandContext}
        onToggleExpand={() => {
          const next = !expandContext;
          setExpandContext(next);
          toggleAll(next);
          writePagesState({ expanded: next });
        }}
        onToggleGui={onToggleShowGui}
        showGui={showGui}
        onLog={logContext}
        onClose={hideContext}
        onToggleExchange={onToggleExchange}
        showExchange={showExchange}
      />

      <div className={containerClass}>
        {/* LEFT PANE (Exchange tree) */}
        <div className={leftPaneClass}>
          <Row text="Exchange Context" depth={0} open />

          {/* Settings (virtual tree as ARRAY; nodes include `name` string) */}
          <TreeView
            label="settings"
            value={settingsObj}
            exp={ui.exp}
            onTogglePath={onTogglePath}
            enumRegistry={enumRegistry}
            dense
            rootDepth={1}
          />

          {/* Everything except settings */}
          {Object.keys(restRaw).map((k) => (
            <TreeView
              key={`rest.${k}`}
              label={k}
              value={(restRaw as any)[k]}
              exp={ui.exp}
              onTogglePath={onTogglePath}
              enumRegistry={enumRegistry}
              dense
              rootDepth={1}
            />
          ))}
        </div>

        {/* RIGHT PANE (GUI/Price) */}
        <div className={rightPaneClass}>
          {showGui && (
            <div className="h-full min-h-[240px] pt-[48px]">
              <PriceView />
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* 🔐 PANEL REGISTRY (kept hidden so panels appear in the tree)   */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <PanelGate panel={SP.MAIN_TRADING_PANEL}>
        <div className="hidden">
          {/* Core header + trading station so they also appear in this page’s tree */}
          <PanelGate panel={SP.TRADE_CONTAINER_HEADER}>
            <TradeContainerHeader />
          </PanelGate>
          <PanelGate panel={SP.TRADING_STATION_PANEL}>
            <TradingStationPanel />
          </PanelGate>

          {/* Token/address selectors + hub/error */}
          <PanelGate panel={SP.BUY_LIST_SELECT_PANEL}>
            <TokenListSelectPanel />
          </PanelGate>
          <PanelGate panel={SP.SELL_LIST_SELECT_PANEL}>
            <TokenListSelectPanel />
          </PanelGate>
          <PanelGate panel={SP.RECIPIENT_LIST_SELECT_PANEL}>
            <RecipientListSelectPanel />
          </PanelGate>
          <PanelGate panel={SP.AGENT_LIST_SELECT_PANEL}>
            <AgentSelectPanel />
          </PanelGate>

          {/* Manage LIST views */}
          <PanelGate panel={SP.MANAGE_SPONSORSHIPS_PANEL}>
            <ManageSponsorshipsPanel />
          </PanelGate>
          <PanelGate panel={SP.MANAGE_RECIPIENTS_PANEL}>
            <ManageRecipients />
          </PanelGate>
          <PanelGate panel={SP.MANAGE_AGENTS_PANEL}>
            <ManageAgents />
          </PanelGate>
          <PanelGate panel={SP.MANAGE_SPONSORS_PANEL}>
            <ManageSponsors />
          </PanelGate>

          {/* Manage DETAIL views */}
          <PanelGate panel={SP.MANAGE_AGENT_PANEL}>
            <ManageAgent />
          </PanelGate>
          <PanelGate panel={SP.MANAGE_RECIPIENT_PANEL}>
            <ManageRecipient />
          </PanelGate>
          <PanelGate panel={SP.MANAGE_SPONSOR_PANEL}>
            <ManageSponsor />
          </PanelGate>
        </div>
      </PanelGate>
    </div>
  );
}
