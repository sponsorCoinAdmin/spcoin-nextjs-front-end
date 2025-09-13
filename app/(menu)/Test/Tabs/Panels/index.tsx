// File: app/(menu)/Test/Tabs/Panels/index.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure'; // unified enum import

const pill = (on?: boolean) =>
  `px-2 py-0.5 rounded-full text-xs ${on ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-300'}`;

const btn = 'px-2 py-1 rounded border border-slate-600 hover:bg-slate-700 text-sm';

export default function PanelsTab() {
  const { setState } = usePageState();
  const { activeMainOverlay, isVisible, openPanel, closePanel, isTokenScrollVisible } = usePanelTree();

  // Panels we want to inspect/control in this tab
  const KNOWN_PANELS: SP_COIN_DISPLAY[] = useMemo(
    () => [
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,     // main overlay (radio group)
      SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL,
      SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL,
      SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,
      SP_COIN_DISPLAY.AGENT_SELECT_PANEL,
      SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL,
    ],
    []
  );

  // Treat Trading Station as the only "main overlay" we expose here
  const isMainOverlay = useCallback(
    (p: SP_COIN_DISPLAY) => p === SP_COIN_DISPLAY.TRADING_STATION_PANEL,
    []
  );

  const updateExchangePage = useCallback((updates: any) => {
    setState((prev: any) => ({
      ...prev,
      page: {
        ...prev?.page,
        exchangePage: {
          ...(prev?.page?.exchangePage ?? {}),
          ...updates,
        },
      },
    }));
  }, [setState]);

  const hidePanelTree = useCallback(() => {
    updateExchangePage({ showPanels: false });
  }, [updateExchangePage]);

  // Toggle helper that respects main overlay semantics
  const togglePanel = useCallback(
    (panel: SP_COIN_DISPLAY, reason?: string) => {
      if (isMainOverlay(panel)) {
        // main overlays can't be "closed"; make it the active one
        openPanel(panel);
        return;
      }
      // non-main: simple toggle
      isVisible(panel) ? closePanel(panel) : openPanel(panel);
    },
    [isMainOverlay, isVisible, openPanel, closePanel]
  );

  // "Open only" behavior for this tab
  // - If main overlay: activate Trading Station and leave others as-is
  // - If non-main: open target and close all other KNOWN_PANELS that are non-main
  const openOnlyHere = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      if (isMainOverlay(panel)) {
        openPanel(panel);
        return;
      }
      // Close every other non-main panel
      KNOWN_PANELS.forEach((p) => {
        if (p !== panel && !isMainOverlay(p) && isVisible(p)) {
          closePanel(p);
        }
      });
      // Ensure target is open
      openPanel(panel);
    },
    [KNOWN_PANELS, isMainOverlay, isVisible, openPanel, closePanel]
  );

  // Build "node list" view from KNOWN_PANELS + visibility
  const nodes = useMemo(
    () =>
      KNOWN_PANELS.map((p) => ({
        panel: p,
        visible: isVisible(p),
      })),
    [KNOWN_PANELS, isVisible]
  );

  return (
    <div className="space-y-4">
      {/* Header row: reduced top buffer by half (-mt-3 ≈ -12px) */}
      <div className="grid grid-cols-3 items-center -mt-3">
        <div /> {/* spacer keeps the title perfectly centered */}
        <h2 className="text-xl font-semibold text-center">Panels</h2>
        <div className="flex justify-end">
          <button
            onClick={hidePanelTree}
            aria-label="Close Panels"
            title="Close Panels"
            className="h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none
                       hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
            type="button"
          >
            ×
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <QuickAction
          label="Open Trading Station only"
          onClick={() => openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL)}
        />
        <QuickAction
          label="Toggle Buy Select"
          onClick={() => togglePanel(SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL, 'PanelsTab:toggleBuy')}
        />
        <QuickAction
          label="Toggle Sell Select"
          onClick={() => togglePanel(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL, 'PanelsTab:toggleSell')}
        />
        <QuickAction
          label="Toggle Recipient Select"
          onClick={() => togglePanel(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL, 'PanelsTab:toggleRecipient')}
        />
        <QuickAction
          label="Toggle Agent Select"
          onClick={() => togglePanel(SP_COIN_DISPLAY.AGENT_SELECT_PANEL, 'PanelsTab:toggleAgent')}
        />
        <QuickAction
          label="Toggle Sponsor Rate Config"
          onClick={() => togglePanel(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL, 'PanelsTab:toggleSponsorCfg')}
        />
      </div>

      {/* Tree inspector */}
      <div className="rounded-2xl border border-slate-700 p-4">
        <div className="font-medium mb-3">Panel Tree</div>
        <ul className="space-y-2">
          {nodes.map((n, i) => (
            <li key={`${n.panel}-${i}`} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs opacity-70">#{n.panel}</span>
                <span>{SP_COIN_DISPLAY[n.panel]}</span>
                <span className={pill(n.visible)}>{n.visible ? 'visible' : 'hidden'}</span>
                {n.panel === SP_COIN_DISPLAY.TRADING_STATION_PANEL && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300">
                    main
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className={btn} onClick={() => togglePanel(n.panel, 'PanelsTab:toggle')} type="button">
                  Toggle
                </button>
                <button className={btn} onClick={() => openOnlyHere(n.panel)} type="button">
                  Open only
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Root/main overlay info */}
      <div className="rounded-2xl border border-slate-700 p-4 text-sm">
        <div className="font-medium mb-2">Main Overlay</div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs opacity-70">#{activeMainOverlay}</span>
          <span>{SP_COIN_DISPLAY[activeMainOverlay]}</span>
          <span className={pill(true)}>active</span>
        </div>

        <div className="mt-3 text-xs opacity-80">
          Token scroll visible: <span className={pill(isTokenScrollVisible)}>{isTokenScrollVisible ? 'yes' : 'no'}</span>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-700 text-sm text-left"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
