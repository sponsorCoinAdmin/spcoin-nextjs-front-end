// File: app/(menu)/Test/Tabs/ExchangeContext/index.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelControls } from './hooks/usePanelControls';
import { useExpandCollapse } from './hooks/useExpandCollapse';
import { useExchangePageState } from './hooks/useExchangePageState';
import TopBar from './components/TopBar';
import TreeView from './components/Tree/TreeView';
import Row from './components/Tree/Row';
import { enumRegistry } from './state/enumRegistry';
import PriceView from '@/app/(menu)/Exchange/Price';

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

  // Render settings via TreeView so spacing matches other branches
  const settingsObj = {
    apiTradingProvider: (exchangeContext as any)?.settings?.apiTradingProvider,
    mainPanelNode: ((exchangeContext as any)?.settings?.mainPanelNode) ?? [],
  };

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
