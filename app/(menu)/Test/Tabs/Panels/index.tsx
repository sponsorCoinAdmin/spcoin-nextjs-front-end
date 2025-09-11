// File: app/(menu)/Test/Tabs/Panels/index.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY } from '@/lib/structure/enums/spCoinDisplay';

const pill = (on?: boolean) =>
  `px-2 py-0.5 rounded-full text-xs ${on ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-300'}`;

const btn = 'px-2 py-1 rounded border border-slate-600 hover:bg-slate-700 text-sm';

export default function PanelsTab() {
  const { setState } = usePageState();
  const { root, flat, toggle, openOnlyIn } = usePanelTree();

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

  const openOnlyGlobal = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      const group = flat.map((n) => n.panel).filter((p) => p !== panel);
      openOnlyIn(panel, group, 'PanelsTab:openOnlyGlobal');
    },
    [flat, openOnlyIn]
  );

  const nodes = useMemo(() => flat, [flat]);

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
          onClick={() => openOnlyGlobal(SP_COIN_DISPLAY.TRADING_STATION_PANEL)}
        />
        <QuickAction
          label="Toggle Buy Select"
          onClick={() => toggle(SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL, 'PanelsTab:toggleBuy')}
        />
        <QuickAction
          label="Toggle Sell Select"
          onClick={() => toggle(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL, 'PanelsTab:toggleSell')}
        />
        <QuickAction
          label="Toggle Recipient Select"
          onClick={() => toggle(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL, 'PanelsTab:toggleRecipient')}
        />
        <QuickAction
          label="Toggle Agent Select"
          onClick={() => toggle(SP_COIN_DISPLAY.AGENT_SELECT_PANEL, 'PanelsTab:toggleAgent')}
        />
        <QuickAction
          label="Toggle Sponsor Rate Config"
          onClick={() => toggle(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL, 'PanelsTab:toggleSponsorCfg')}
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
              </div>
              <div className="flex items-center gap-2">
                <button className={btn} onClick={() => toggle(n.panel, 'PanelsTab:toggle')} type="button">
                  Toggle
                </button>
                <button className={btn} onClick={() => openOnlyGlobal(n.panel)} type="button">
                  Open only
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Root info */}
      <div className="rounded-2xl border border-slate-700 p-4 text-sm">
        <div className="font-medium mb-2">Root</div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs opacity-70">#{root.panel}</span>
          <span>{SP_COIN_DISPLAY[root.panel]}</span>
          <span className={pill(root.visible)}>{root.visible ? 'visible' : 'hidden'}</span>
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
