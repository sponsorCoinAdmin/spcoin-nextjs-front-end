// File: app/(menu)/Test/Tabs/Panels/index.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';

// ✅ Env flags to hide ID & visibility columns in this list UI too
const SHOW_IDS = process.env.NEXT_PUBLIC_TREE_SHOW_IDS !== 'false';
const SHOW_VIS = process.env.NEXT_PUBLIC_TREE_SHOW_VISIBILITY !== 'false';

const pill = (on?: boolean) =>
  `px-2 py-0.5 rounded-full text-xs ${
    on ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-300'
  }`;

const btn = 'px-2 py-1 rounded border border-slate-600 hover:bg-slate-700 text-sm';

export default function PanelsTab() {
  const { setState } = usePageState();
  const { activeMainOverlay, isVisible, openPanel, closePanel, isTokenScrollVisible } =
    usePanelTree();

  const KNOWN_PANELS: SP_COIN_DISPLAY[] = useMemo(
    () => [
      SP_COIN_DISPLAY.TRADING_STATION_PANEL,
      SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
      SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
      SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
      SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
      SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      SP_COIN_DISPLAY.CONFIG_SPONSORSHIP_PANEL,
      SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL,
      SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
    ],
    []
  );

  const isMainOverlay = useCallback(
    (p: SP_COIN_DISPLAY) => MAIN_OVERLAY_GROUP.includes(p),
    []
  );

  const updateExchangePage = useCallback(
    (updates: any) => {
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
    },
    [setState]
  );

  const hidePanelTree = useCallback(() => {
    updateExchangePage({ showPanels: false });
  }, [updateExchangePage]);

  const togglePanel = useCallback(
    (panel: SP_COIN_DISPLAY, _reason?: string) => {
      if (isMainOverlay(panel)) {
        isVisible(panel) ? closePanel(panel) : openPanel(panel);
        return;
      }
      isVisible(panel) ? closePanel(panel) : openPanel(panel);
    },
    [isMainOverlay, isVisible, openPanel, closePanel]
  );

  const openOnlyHere = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      if (isMainOverlay(panel)) {
        openPanel(panel);
        return;
      }
      KNOWN_PANELS.forEach((p) => {
        if (p !== panel && !isMainOverlay(p) && isVisible(p)) closePanel(p);
      });
      openPanel(panel);
    },
    [KNOWN_PANELS, isMainOverlay, isVisible, openPanel, closePanel]
  );

  const nodes = useMemo(
    () =>
      KNOWN_PANELS.map((p) => ({
        panel: p,
        visible: isVisible(p),
        main: isMainOverlay(p),
      })),
    [KNOWN_PANELS, isMainOverlay, isVisible]
  );

  const hasActiveOverlay = activeMainOverlay !== null && activeMainOverlay !== undefined;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="grid grid-cols-3 items-center -mt-3">
        <div />
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

      {/* Quick actions (unchanged) */}
      {/* ... */}

      {/* Tree inspector */}
      <div className="rounded-2xl border border-slate-700 p-4">
        <div className="font-medium mb-3">Panel Tree</div>
        <ul className="space-y-2">
          {nodes.map((n, i) => (
            <li key={`${n.panel}-${i}`} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {SHOW_IDS && (
                  <span className="font-mono text-xs opacity-70">#{n.panel}</span>
                )}
                <span>{SP_COIN_DISPLAY[n.panel]}</span>
                {SHOW_VIS && (
                  <span className={pill(n.visible)}>{n.visible ? 'visible' : 'hidden'}</span>
                )}
                {n.main && (
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

      {/* Root/main overlay info (left intact) */}
      <div className="rounded-2xl border border-slate-700 p-4 text-sm">
        <div className="font-medium mb-2">Main Overlay</div>

        {!hasActiveOverlay ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs opacity-70">—</span>
            <span>None</span>
            <span className={pill(false)}>inactive</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {SHOW_IDS && (
              <span className="font-mono text-xs opacity-70">#{activeMainOverlay}</span>
            )}
            <span>{SP_COIN_DISPLAY[activeMainOverlay as number]}</span>
            <span className={pill(true)}>active</span>
          </div>
        )}

        <div className="mt-3 text-xs opacity-80">
          Token scroll visible:{' '}
          <span className={pill(isTokenScrollVisible)}>
            {isTokenScrollVisible ? 'yes' : 'no'}
          </span>
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
