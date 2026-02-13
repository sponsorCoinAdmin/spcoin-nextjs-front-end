// File: app/(menu)/Test/Tabs/ExchangeContext/index.tsx
'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { useExpandCollapse } from './hooks/useExpandCollapse';
import { useExchangePageState } from './hooks/useExchangePageState';
import TreeView from './components/Tree/TreeView';
import Row from './components/Tree/Row';
import { enumRegistry } from './state/enumRegistry';

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

type ExchangeContextTabProps = {
  onToggleAllReady?: (toggleAllFn: (nextExpand: boolean) => void) => void;
};

export default function ExchangeContextTab({ onToggleAllReady }: ExchangeContextTabProps) {
  const { exchangeContext } = useExchangeContext();
  const { expandContext } = useExchangePageState();
  const { ui, toggleAll, togglePath, restRaw } = useExpandCollapse(exchangeContext, expandContext);

  // Build the virtual (display-only) tree from the builder
  const { tree } = useVirtualPanelTree(exchangeContext);
  const treeWithNames = useMemo<NamedVirtualNode[]>(
    () => addNamesShallow(tree as unknown as NamedVirtualNode[]),
    [tree]
  );

  useEffect(() => {
    onToggleAllReady?.(toggleAll);
  }, [onToggleAllReady, toggleAll]);

  const onTogglePath = useCallback((path: string) => togglePath(path), [togglePath]);

  const settingsObj = useMemo(() => {
    const realSettings = (exchangeContext as any)?.settings ?? {};
    return {
      ...realSettings,
      spCoinPanelTree: treeWithNames,
    };
  }, [exchangeContext, treeWithNames]);

  return (
    <div className="space-y-0">
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
          <PanelGate panel={SP.TOKEN_LIST_SELECT_PANEL}>
            <TokenListSelectPanel />
          </PanelGate>
          <PanelGate panel={SP.ACCOUNT_LIST_SELECT_PANEL}>
            <RecipientListSelectPanel />
            <AgentListSelectPanel />
            <ManageSponsorRecipients />
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
