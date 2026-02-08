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
import ManageSponsorRecipients from '@/components/views/RadioOverlayPanels/ListSelectPanels/SponsorListSelectPanel';
import ManageSponsorshipsPanel from '@/components/views/RadioOverlayPanels/ManageSponsorshipsPanel';


// Select / aux overlays
import {
  TokenListSelectPanel,
  RecipientListSelectPanel,
  AgentListSelectPanel,
} from '@/components/views/AssetSelectPanels';

// Core header/panel components (registered here so they’re visible in the tree)
import TradeContainerHeader from '@/components/views/Headers/TradeContainerHeader';
import TradingStationPanel from '@/components/views/TradingStationPanel';
import { TEST_EXCHANGE_CONTEXT_PAGES } from '@/lib/context/exchangeContext/localStorageKeys';

type NamedVirtualNode = {
  id: number;
  visible: boolean;
  children: NamedVirtualNode[];
  name?: string;
};

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
    const raw = window.localStorage.getItem(TEST_EXCHANGE_CONTEXT_PAGES);
    return raw ? (JSON.parse(raw) as PagesState) : {};
  } catch {
    return {};
  }
}
function writePagesState(patch: PagesState) {
  try {
    const current = readPagesState();
    const next = { ...current, ...patch };
    window.localStorage.setItem(TEST_EXCHANGE_CONTEXT_PAGES, JSON.stringify(next));
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
      // Keep the header's toggle in sync with last state,
      // but DO NOT stomp the per-branch expansion map on boot.
      setExpandContext(expanded);
      // ❌ Do NOT call toggleAll(expanded) here.
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

  const settingsObj = useMemo(() => {
    const realSettings = (exchangeContext as any)?.settings ?? {};
    return {
      ...realSettings,
      spCoinPanelTree: treeWithNames,
    };
  }, [exchangeContext, treeWithNames]);

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

          {/* Settings */}
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
            <AgentListSelectPanel />
          </PanelGate>

          {/* Manage LIST views */}
          <PanelGate panel={SP.MANAGE_SPONSORSHIPS_PANEL}>
            <ManageSponsorshipsPanel />
          </PanelGate>
 
          {/* Sponsors list rewards panel */}
          <PanelGate panel={SP.ACCOUNT_LIST_REWARDS_PANEL}>
            <ManageSponsorRecipients />
          </PanelGate>

        </div>
      </PanelGate>
    </div>
  );
}
