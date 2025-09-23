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
import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

const PAGES_KEY = 'test_exchangeContext_pages';

type PagesState = {
  showGui?: boolean;
  expanded?: boolean;
};

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
    // ignore storage issues
  }
}

export default function ExchangeContextTab() {
  const { exchangeContext } = useExchangeContext();
  const { expandContext, setExpandContext, hideContext, logContext } = useExchangePageState();
  const { isVisible, onTogglePanel } = usePanelControls(); // kept if you later re-add panel toggles
  const { ui, setHeader, toggleAll, togglePath, restRaw } = useExpandCollapse(
    exchangeContext,
    expandContext
  );

  // Show/Hide GUI toggle — hydrate synchronously from the shared key
  const [showGui, setShowGui] = useState<boolean>(() => {
    const { showGui } = readPagesState();
    return !!showGui;
  });

  // On mount: hydrate Expand/Collapse (and mirror to Tree expand-all)
  useEffect(() => {
    const { expanded } = readPagesState();
    if (typeof expanded === 'boolean') {
      setExpandContext(expanded);
      toggleAll(expanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist both states any time either changes
  useEffect(() => {
    writePagesState({ showGui, expanded: expandContext });
  }, [showGui, expandContext]);

  const onToggleShowGui = useCallback(() => {
    setShowGui((prev) => !prev);
  }, []);

  /**
   * Reorder only for display in this Test page:
   * Under TRADING_STATION_PANEL, show SELL_SELECT_PANEL before BUY_SELECT_PANEL.
   * This does NOT mutate the stored exchangeContext.
   */
  const reorderedMainPanelNode = useMemo(() => {
    const node = (exchangeContext as any)?.settings?.mainPanelNode;
    if (!Array.isArray(node)) return [];

    // Deep clone
    const cloned = JSON.parse(JSON.stringify(node)) as any[];

    // Find TRADING_STATION_PANEL root
    const tradingIdx = cloned.findIndex((n) => n?.panel === SP_TREE.TRADING_STATION_PANEL);
    if (tradingIdx < 0) return cloned;

    const trading = cloned[tradingIdx];
    const children = Array.isArray(trading?.children) ? trading.children.slice() : [];
    if (!children.length) return cloned;

    const sell = children.find((c: any) => c?.panel === SP_TREE.SELL_SELECT_PANEL);
    const buy  = children.find((c: any) => c?.panel === SP_TREE.BUY_SELECT_PANEL);
    const rest = children.filter(
      (c: any) =>
        c?.panel !== SP_TREE.SELL_SELECT_PANEL &&
        c?.panel !== SP_TREE.BUY_SELECT_PANEL
    );

    // Only change order if at least one of sell/buy exists
    if (sell || buy) {
      trading.children = [
        ...(sell ? [sell] : []),
        ...(buy  ? [buy]  : []),
        ...rest,
      ];
      cloned[tradingIdx] = trading;
    }

    return cloned;
  }, [exchangeContext]);

  // Render settings via TreeView so spacing matches other branches
  const settingsObj = useMemo(
    () => ({
      apiTradingProvider: (exchangeContext as any)?.settings?.apiTradingProvider,
      // Use the reordered version here
      mainPanelNode: reorderedMainPanelNode,
    }),
    [exchangeContext, reorderedMainPanelNode]
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

      {/* Split layout: when showGui=false → left fills the space; showGui=true → left/right panes */}
      <div className={`px-4 ${showGui ? 'flex gap-4' : ''}`}>
        {/* LEFT PANE (always visible) */}
        <div className={`${showGui ? 'flex-1' : 'w-full'}`}>
          {/* Title row (not collapsible) */}
          <Row text="Exchange Context" depth={0} open />

          {/* Settings rendered exactly like other branches */}
          <TreeView
            label="settings"
            value={settingsObj}
            exp={ui.exp}
            onTogglePath={togglePath}
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
              onTogglePath={togglePath}
              enumRegistry={enumRegistry}
              dense
              rootDepth={1}
            />
          ))}
        </div>

        {/* RIGHT PANE (PriceView, lowered by 48px as in your current version) */}
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
