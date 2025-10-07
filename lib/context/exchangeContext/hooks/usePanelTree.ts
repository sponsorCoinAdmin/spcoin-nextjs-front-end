// File: lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP, PANEL_DEFS } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { panelStore } from '@/lib/context/exchangeContext/panelStore';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true';
const debugLog = createDebugLogger('usePanelTree', DEBUG_ENABLED, LOG_TIME);

const KNOWN = new Set<number>(PANEL_DEFS.map((d) => d.id));

type PanelEntry = { panel: SP_COIN_DISPLAY; visible: boolean };

/* ------------------------------ helpers ------------------------------ */

function flatten(nodes: any[] | undefined): PanelEntry[] {
  if (!Array.isArray(nodes)) return [];
  const out: PanelEntry[] = [];
  const walk = (ns: any[]) => {
    for (const n of ns) {
      const id = typeof n?.panel === 'number' ? (n.panel as number) : NaN;
      if (!Number.isFinite(id) || !KNOWN.has(id)) {
        if (DEBUG_ENABLED) debugLog.warn('dropping unknown panel id during flatten()', n?.panel);
        continue;
      }
      out.push({ panel: id as SP_COIN_DISPLAY, visible: !!n.visible });
      if (Array.isArray(n.children) && n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  const seen = new Set<number>();
  return out.filter((e) => (seen.has(e.panel) ? false : (seen.add(e.panel), true)));
}

function toMap(list: PanelEntry[]): Record<number, boolean> {
  const m: Record<number, boolean> = {};
  for (const e of list) m[e.panel] = !!e.visible;
  return m;
}

function writeFlat(prevCtx: any, next: PanelEntry[]) {
  return { ...prevCtx, settings: { ...(prevCtx?.settings ?? {}), spCoinPanelTree: next } };
}

function ensurePanelPresent(list: PanelEntry[], panel: SP_COIN_DISPLAY): PanelEntry[] {
  return list.some((e) => e.panel === panel) ? list : [...list, { panel, visible: false }];
}

function diffAndPublish(prevMap: Record<number, boolean>, nextMap: Record<number, boolean>) {
  // publish changes to the lightweight panelStore so subscribers only re-render for affected panels
  const ids = new Set<number>([...Object.keys(prevMap), ...Object.keys(nextMap)].map(Number));
  ids.forEach((idNum) => {
    const id = idNum as SP_COIN_DISPLAY;
    const prev = !!prevMap[idNum];
    const next = !!nextMap[idNum];
    if (prev !== next) panelStore.setVisible(id, next);
  });
}

/* --------------------------------- hook --------------------------------- */

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const list = useMemo<PanelEntry[]>(() => flatten((exchangeContext as any)?.settings?.spCoinPanelTree), [exchangeContext]);
  const map = useMemo(() => toMap(list), [list]);

  const overlays = useMemo(() => MAIN_OVERLAY_GROUP.slice(), []);

  // Sync panelStore with current map (covers initial load and any external migrations)
  const prevMapRef = useRef<Record<number, boolean> | null>(null);
  useEffect(() => {
    const prev = prevMapRef.current ?? {};
    diffAndPublish(prev, map);
    prevMapRef.current = map;
  }, [map]);

  // If multiple overlays somehow visible, collapse to the first (and publish)
  useEffect(() => {
    const visible = overlays.filter((id) => !!map[id]);
    if (visible.length <= 1) return;
    const keep = visible[0];
    debugLog.log('reconcile overlays → keep', keep);
    setExchangeContext((prev) => {
      const flatPrev = flatten((prev as any)?.settings?.spCoinPanelTree);
      const next = flatPrev.map((e) => (overlays.includes(e.panel) ? { ...e, visible: e.panel === keep } : e));
      // publish diffs to panelStore immediately
      const prevMap = toMap(flatPrev);
      const nextMap = toMap(next);
      diffAndPublish(prevMap, nextMap);
      return writeFlat(prev, next);
    }, 'usePanelTree:reconcile');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, overlays.join('|')]);

  /* ------------------------------- queries ------------------------------- */

  // Stable reference; reads from panelStore snapshot (Phase 7)
  const isVisible = useCallback((panel: SP_COIN_DISPLAY) => panelStore.isVisible(panel), []);

  const getPanelChildren = useCallback((_parent: SP_COIN_DISPLAY) => [] as SP_COIN_DISPLAY[], []);

  /* ------------------------------- actions ------------------------------- */

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      if (!KNOWN.has(panel)) {
        if (DEBUG_ENABLED) debugLog.warn('openPanel ignored unknown id', panel);
        return;
      }
      debugLog.log('open', panel);
      setExchangeContext((prev) => {
        const flat0 = flatten((prev as any)?.settings?.spCoinPanelTree);
        let flat = ensurePanelPresent(flat0, panel);

        if (overlays.includes(panel)) {
          // radio: set ONLY this overlay to visible, others to false
          flat = overlays.reduce((acc, id) => {
            const idx = acc.findIndex((e) => e.panel === id);
            if (idx >= 0) acc[idx] = { ...acc[idx], visible: id === panel };
            else acc.push({ panel: id, visible: id === panel });
            return acc;
          }, [...flat]);
          const prevMap = toMap(flat0);
          const nextMap = toMap(flat);
          diffAndPublish(prevMap, nextMap);
          return writeFlat(prev, flat);
        }

        // non-radio: simple visible=true
        const prevMap = toMap(flat0);
        const nextFlat = [...flat];
        const i = nextFlat.findIndex((e) => e.panel === panel);
        if (i >= 0) nextFlat[i] = { ...nextFlat[i], visible: true };
        else nextFlat.push({ panel, visible: true });
        const nextMap = toMap(nextFlat);
        diffAndPublish(prevMap, nextMap);
        return writeFlat(prev, nextFlat);
      }, 'usePanelTree:open');
    },
    [setExchangeContext, overlays]
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      if (!KNOWN.has(panel)) {
        if (DEBUG_ENABLED) debugLog.warn('closePanel ignored unknown id', panel);
        return;
      }
      debugLog.log('close', panel);
      setExchangeContext((prev) => {
        const flat0 = flatten((prev as any)?.settings?.spCoinPanelTree);

        if (overlays.includes(panel)) {
          // If we're closing an ACTIVE overlay → allow "none selected"
          const isActive = !!flat0.find((e) => e.panel === panel && e.visible);
          if (isActive) {
            const prevMap = toMap(flat0);
            const next = overlays.reduce((acc, id) => {
              const idx = acc.findIndex((e) => e.panel === id);
              if (idx >= 0) acc[idx] = { ...acc[idx], visible: false };
              else acc.push({ panel: id, visible: false });
              return acc;
            }, [...flat0]);
            const nextMap = toMap(next);
            diffAndPublish(prevMap, nextMap);
            return writeFlat(prev, next);
          }
          // If overlay exists but isn't active, just ensure it is false (usually no-op)
          const prevMap = toMap(flat0);
          const nextFlat = flat0.map((e) => (e.panel === panel ? { ...e, visible: false } : e));
          const nextMap = toMap(nextFlat);
          diffAndPublish(prevMap, nextMap);
          return writeFlat(prev, nextFlat);
        }

        // non-radio: mark false if present
        const prevMap = toMap(flat0);
        const nextFlat = [...flat0];
        const i = nextFlat.findIndex((e) => e.panel === panel);
        if (i >= 0 && nextFlat[i].visible) nextFlat[i] = { ...nextFlat[i], visible: false };
        const nextMap = toMap(nextFlat);
        diffAndPublish(prevMap, nextMap);
        return writeFlat(prev, nextFlat);
      }, 'usePanelTree:close');
    },
    [setExchangeContext, overlays]
  );

  /* ------------------------------- derived -------------------------------- */

  // Return null when no overlay is selected (computed from context map)
  const activeMainOverlay = useMemo<SP_COIN_DISPLAY | null>(() => {
    for (const id of overlays) if (map[id]) return id;
    return null;
  }, [map, overlays]);

  // Use context map for this aggregate; independent of isVisible's stable ref
  const isTokenScrollVisible = useMemo(
    () => map[SP_COIN_DISPLAY.BUY_SELECT_PANEL] || map[SP_COIN_DISPLAY.SELL_SELECT_PANEL],
    [map]
  );

  return {
    activeMainOverlay, // SP_COIN_DISPLAY | null
    isVisible, // stable ref (panelStore-backed)
    isTokenScrollVisible,
    getPanelChildren,
    openPanel,
    closePanel,
  };
}
