// File: app/(menu)/Test/Tabs/ExchangeContext/index.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelControls } from './hooks/usePanelControls';
import { useExpandCollapse } from './hooks/useExpandCollapse';
import { useExchangePageState } from './hooks/useExchangePageState';
import TopBar from './components/TopBar';
import TreeView from './components/Tree/TreeView';
import Row from './components/Tree/Row';
import { enumRegistry } from './state/enumRegistry';
import PriceView from '@/app/(menu)/Exchange/Price';

// Virtual tree builder (page-local)
import { useVirtualPanelTree } from './hooks/useVirtualPanelTree';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

import type { PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

// ✅ Local, structural type compatible with both shapes (with/without `name`)
type NamedVirtualNode = {
  id: number;
  visible: boolean;
  children: NamedVirtualNode[];
  name?: string; // optional so nodes from useVirtualPanelTree are assignable
};

const PAGES_KEY = 'test_exchangeContext_pages';

// Show SPONSOR row at top-level? (purely visual)
const SHOW_SPONSOR_ROW = false;

// ────────────────────────────────────────────────────────────────────────────
// Pretty console helpers
function flatForConsole(flat?: PanelNode[]) {
  if (!Array.isArray(flat)) return flat;
  return flat.map((n) => ({
    id: `${SP[n.panel] ?? 'UNKNOWN'} (#${n.panel})`,
    visible: !!n.visible,
    children: Array.isArray(n.children)
      ? n.children.map((c) => ({
          id: `${SP[c.panel] ?? 'UNKNOWN'} (#${c.panel})`,
          visible: !!c.visible,
        }))
      : undefined,
  }));
}
function virtualForConsole(nodes: NamedVirtualNode[]) {
  const walk = (ns: NamedVirtualNode[]): any[] =>
    ns.map((n) => ({
      id: `${SP[n.id] ?? 'UNKNOWN'} (#${n.id})`,
      visible: n.visible,
      children: walk(n.children ?? []),
    }));
  return walk(nodes);
}

type PagesState = { showGui?: boolean; expanded?: boolean };

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

// ✅ Decorate each node with a human-readable name (shown when expanded).
//    This does NOT change paths or expansion logic (still arrays).
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

export default function ExchangeContextTab() {
  const { exchangeContext } = useExchangeContext();
  const { expandContext, setExpandContext, hideContext, logContext } = useExchangePageState();
  // kept if you later re-add panel toggles
  const { isVisible, onTogglePanel } = usePanelControls();
  const { ui, toggleAll, togglePath, restRaw } = useExpandCollapse(
    exchangeContext,
    expandContext
  );

  // Build the virtual, display-only tree from the flat persisted state
  const { tree, orphans, missing } = useVirtualPanelTree(exchangeContext);

  // Filter sponsor row visually (doesn't touch keys/paths)
  const treeForDisplay = useMemo(
    () =>
      (SHOW_SPONSOR_ROW
        ? (tree as unknown as NamedVirtualNode[])
        : (tree as unknown as NamedVirtualNode[]).filter(
            (n) => n.id !== SP.SPONSOR_SELECT_PANEL_LIST
          )),
    [tree]
  );

  // Add `name` string to every top-level node (and its direct children)
  const treeWithNames = useMemo<NamedVirtualNode[]>(
    () => addNamesShallow(treeForDisplay),
    [treeForDisplay]
  );

  // Console dump (original + derived)
  useEffect(() => {
    const flat = (exchangeContext as any)?.settings?.spCoinPanelTree as PanelNode[] | undefined;
    console.groupCollapsed('%c[ExchangeContextTab] Panel State Dump', 'color:#0bf');
    console.log('Flat spCoinPanelTree:', flatForConsole(flat));
    console.log('Virtual tree (derived):', virtualForConsole(treeWithNames));
    console.log('Orphans (in state, not in schema):', orphans.map((id) => `${SP[id]} (#${id})`));
    console.log('Missing (in schema, not in state):', missing.map((id) => `${SP[id]} (#${id})`));
    (window as any).__dumpPanels = () => ({
      flat: flatForConsole(flat),
      virtual: virtualForConsole(treeWithNames),
      orphans: orphans.map((id) => `${SP[id]} (#${id})`),
      missing: missing.map((id) => `${SP[id]} (#${id})`),
    });
    console.groupEnd();
  }, [exchangeContext, treeWithNames, orphans, missing]);

  // Show/Hide GUI toggle — hydrate synchronously
  const [showGui, setShowGui] = useState<boolean>(() => !!readPagesState().showGui);

  // Hydrate expand state on mount
  useEffect(() => {
    const { expanded } = readPagesState();
    if (typeof expanded === 'boolean') {
      setExpandContext(expanded);
      toggleAll(expanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist both states
  useEffect(() => {
    writePagesState({ showGui, expanded: expandContext });
  }, [showGui, expandContext]);

  const onToggleShowGui = useCallback(() => setShowGui((prev) => !prev), []);

  // Use ARRAY for spCoinPanelTree so paths are numeric (no changes to logic)
  const settingsObj = useMemo(
    () => ({
      apiTradingProvider: (exchangeContext as any)?.settings?.apiTradingProvider,
      spCoinPanelTree: treeWithNames, // array; each node now has a `name` field
    }),
    [exchangeContext, treeWithNames]
  );

  // 🔍 Keep detailed click-debugging; do not change toggle logic
  const onTogglePathLogged = useCallback(
    (path: string) => {
      console.log('[TreeView] toggle START');
      console.log('  raw path:', path);
      const parts = path.split('.');
      console.log('  raw parts:', parts);

      const before = (ui as any)?.exp?.[path];
      console.log('  ui.exp BEFORE (has key?):', !!before, 'value:', before);

      togglePath(path);

      setTimeout(() => {
        const after = (ui as any)?.exp?.[path];
        console.log('  ui.exp AFTER (raw key):', after);

        const sampleKeys = Object.keys((ui as any)?.exp ?? {}).slice(0, 20);
        console.log('  ui.exp keys sample:', sampleKeys);
        console.log('[TreeView] toggle END');
      }, 0);
    },
    [togglePath, ui]
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
      />

      <div className={`px-4 ${showGui ? 'flex gap-4' : ''}`}>
        {/* LEFT PANE */}
        <div className={`${showGui ? 'flex-1' : 'w-full'}`}>
          <Row text="Exchange Context" depth={0} open />

          {/* Settings (virtual tree as ARRAY; nodes include `name` string) */}
          <TreeView
            label="settings"
            value={settingsObj}
            exp={ui.exp}
            onTogglePath={onTogglePathLogged}
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
              onTogglePath={onTogglePathLogged}
              enumRegistry={enumRegistry}
              dense
              rootDepth={1}
            />
          ))}
        </div>

        {/* RIGHT PANE */}
        {showGui && (
          <div className="flex-1 border-l border-slate-700">
            <div className="h-full min-h-[240px] pt-[48px]">
              <PriceView />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
