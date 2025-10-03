// File: lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true';
const debugLog = createDebugLogger('usePanelTree', DEBUG_ENABLED, LOG_TIME);

type PanelEntry = { panel: SP_COIN_DISPLAY; visible: boolean };

/* ------------------------------ helpers ------------------------------ */

function flatten(nodes: any[] | undefined): PanelEntry[] {
  if (!Array.isArray(nodes)) return [];
  const out: PanelEntry[] = [];
  const walk = (ns: any[]) => {
    for (const n of ns) {
      if (n && typeof n === 'object' && typeof n.panel === 'number') {
        out.push({ panel: n.panel as SP_COIN_DISPLAY, visible: !!n.visible });
        if (Array.isArray(n.children) && n.children.length) walk(n.children);
      }
    }
  };
  walk(nodes);
  const seen = new Set<number>();
  return out.filter(e => (seen.has(e.panel) ? false : (seen.add(e.panel), true)));
}

function toMap(list: PanelEntry[]): Record<number, boolean> {
  const m: Record<number, boolean> = {};
  for (const e of list) m[e.panel] = !!e.visible;
  return m;
}

function writeFlat(prevCtx: any, next: PanelEntry[]) {
  return { ...prevCtx, settings: { ...(prevCtx?.settings ?? {}), mainPanelNode: next } };
}

function ensurePanelPresent(list: PanelEntry[], panel: SP_COIN_DISPLAY): PanelEntry[] {
  return list.some(e => e.panel === panel) ? list : [...list, { panel, visible: false }];
}

/* --------------------------------- hook --------------------------------- */

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const list = useMemo<PanelEntry[]>(() => flatten((exchangeContext as any)?.settings?.mainPanelNode), [exchangeContext]);
  const map  = useMemo(() => toMap(list), [list]);

  const overlays = useMemo(() => MAIN_OVERLAY_GROUP.slice(), []);

  // If multiple overlays somehow visible, collapse to the first
  useEffect(() => {
    const visible = overlays.filter(id => !!map[id]);
    if (visible.length <= 1) return;
    const keep = visible[0];
    debugLog.log('reconcile overlays → keep', keep);
    setExchangeContext(prev => {
      const flat = flatten((prev as any)?.settings?.mainPanelNode);
      const next = flat.map(e =>
        overlays.includes(e.panel) ? { ...e, visible: e.panel === keep } : e
      );
      return writeFlat(prev, next);
    }, 'usePanelTree:reconcile');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, overlays.join('|')]);

  /* ------------------------------- queries ------------------------------- */

  const isVisible = useCallback(
    (panel: SP_COIN_DISPLAY) => !!map[panel],
    [map]
  );

  const getPanelChildren = useCallback((_parent: SP_COIN_DISPLAY) => [] as SP_COIN_DISPLAY[], []);

  /* ------------------------------- actions ------------------------------- */

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      debugLog.log('open', panel);
      setExchangeContext(prev => {
        const flat0 = flatten((prev as any)?.settings?.mainPanelNode);
        let flat = ensurePanelPresent(flat0, panel);

        if (overlays.includes(panel)) {
          // radio: set ONLY this overlay to visible, others to false
          flat = overlays.reduce((acc, id) => {
            const idx = acc.findIndex(e => e.panel === id);
            if (idx >= 0) acc[idx] = { ...acc[idx], visible: id === panel };
            else acc.push({ panel: id, visible: id === panel });
            return acc;
          }, [...flat]);
          return writeFlat(prev, flat);
        }

        // non-radio: simple visible=true
        const i = flat.findIndex(e => e.panel === panel);
        if (i >= 0) flat[i] = { ...flat[i], visible: true };
        else flat.push({ panel, visible: true });
        return writeFlat(prev, flat);
      }, 'usePanelTree:open');
    },
    [setExchangeContext, overlays]
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      debugLog.log('close', panel);
      setExchangeContext(prev => {
        const flat = flatten((prev as any)?.settings?.mainPanelNode);

        if (overlays.includes(panel)) {
          // If we're closing an ACTIVE overlay → allow "none selected"
          const isActive = !!flat.find(e => e.panel === panel && e.visible);
          if (isActive) {
            const next = overlays.reduce((acc, id) => {
              const idx = acc.findIndex(e => e.panel === id);
              if (idx >= 0) acc[idx] = { ...acc[idx], visible: false };
              else acc.push({ panel: id, visible: false });
              return acc;
            }, [...flat]);
            return writeFlat(prev, next);
          }
          // If overlay exists but isn't active, just ensure it is false
          const i = flat.findIndex(e => e.panel === panel);
          if (i >= 0 && flat[i].visible) flat[i] = { ...flat[i], visible: false };
          return writeFlat(prev, flat);
        }

        // non-radio: mark false if present
        const i = flat.findIndex(e => e.panel === panel);
        if (i >= 0 && flat[i].visible) flat[i] = { ...flat[i], visible: false };
        return writeFlat(prev, flat);
      }, 'usePanelTree:close');
    },
    [setExchangeContext, overlays]
  );

  /* ------------------------------- derived -------------------------------- */

  // Return null when no overlay is selected
  const activeMainOverlay = useMemo<SP_COIN_DISPLAY | null>(() => {
    for (const id of overlays) if (map[id]) return id;
    return null;
  }, [map, overlays]);

  const isTokenScrollVisible = useMemo(
    () =>
      isVisible(SP_COIN_DISPLAY.BUY_SELECT_PANEL) ||
      isVisible(SP_COIN_DISPLAY.SELL_SELECT_PANEL),
    [isVisible]
  );

  return {
    activeMainOverlay,       // now SP_COIN_DISPLAY | null
    isVisible,
    isTokenScrollVisible,
    getPanelChildren,
    openPanel,
    closePanel,
  };
}
