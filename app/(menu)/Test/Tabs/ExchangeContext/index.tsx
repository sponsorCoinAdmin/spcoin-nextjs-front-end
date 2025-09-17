// File: app/(menu)/Test/Tabs/ExchangeContext/index.tsx
'use client';

import React from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelControls } from './hooks/usePanelControls';
import { useExpandCollapse } from './hooks/useExpandCollapse';
import { useExchangePageState } from './hooks/useExchangePageState';
import TopBar from './components/TopBar';
import TreeView from './components/Tree/TreeView';
import Row from './components/Tree/Row';
import { enumRegistry } from './state/enumRegistry';

export default function ExchangeContextTab() {
  const { exchangeContext } = useExchangeContext();
  const { expandContext, setExpandContext, hideContext, logContext } = useExchangePageState();
  const { isVisible, onTogglePanel } = usePanelControls(); // kept if you later re-add panel toggles
  const { ui, setHeader, toggleAll, togglePath, restRaw } = useExpandCollapse(
    exchangeContext,
    expandContext
  );

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
        }}
        onLog={logContext}
        onClose={hideContext}
      />

      <div className="px-4">
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
    </div>
  );
}
