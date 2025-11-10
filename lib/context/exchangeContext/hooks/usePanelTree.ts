// File: lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP, PANEL_DEFS } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { panelStore } from '@/lib/context/exchangeContext/panelStore';

const KNOWN = new Set<number>(PANEL_DEFS.map((d) => d.id));
type PanelEntry = { panel: SP_COIN_DISPLAY; visible: boolean };

/* ------------------------------ debug helpers ------------------------------ */

const PT_DEBUG = true;
const PT_TRACE = false; // flip to true temporarily to see stack traces at call sites

function dbg(label: string, payload?: unknown) {
  if (!PT_DEBUG) return;
  // @debug: PANEL_TREE
  // eslint-disable-next-line no-console
  console.log(`[usePanelTree] ${label}`, payload ?? '');
}

function traceIfEnabled(label: string) {
  if (!PT_DEBUG || !PT_TRACE) return;
  // eslint-disable-next-line no-console
  console.trace(`[usePanelTree] ${label}`);
}

function fmtMap(map: Record<number, boolean>) {
  const out: Record<string, boolean> = {};
  Object.keys(map).forEach((k) => {
    const id = Number(k) as SP_COIN_DISPLAY;
    out[SP_COIN_DISPLAY[id]] = map[id];
  });
  return out;
}

/* ------------------------------ helpers ------------------------------ */

const schedule = (fn: () => void) => setTimeout(fn, 0); // post-commit scheduling

function flatten(nodes: any[] | undefined): PanelEntry[] {
  if (!Array.isArray(nodes)) return [];
  const out: PanelEntry[] = [];
  const walk = (ns: any[]) => {
    for (const n of ns) {
      const id = typeof n?.panel === 'number' ? (n.panel as number) : NaN;
      if (!Number.isFinite(id) || !KNOWN.has(id)) continue;
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
  const ids = new Set<number>([...Object.keys(prevMap), ...Object.keys(nextMap)].map(Number));
  ids.forEach((idNum) => {
    const id = idNum as SP_COIN_DISPLAY;
    const prev = !!prevMap[idNum];
    const next = !!nextMap[idNum];
    if (prev !== next) {
      // @debug: PANEL_TREE publish-change
      dbg(`publish ${SP_COIN_DISPLAY[id]}: ${prev} → ${next}`);
      panelStore.setVisible(id, next);
    }
  });
}

/* --------------------------------- hook --------------------------------- */

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const list = useMemo<PanelEntry[]>(
    () => {
      const flat = flatten((exchangeContext as any)?.settings?.spCoinPanelTree);
      // @debug: PANEL_TREE flatten
      dbg('flatten()', flat.map((e) => ({ panel: SP_COIN_DISPLAY[e.panel], visible: e.visible })));
      return flat;
    },
    [exchangeContext]
  );

  const map = useMemo(() => {
    const m = toMap(list);
    // @debug: PANEL_TREE map
    dbg('map()', fmtMap(m));
    return m;
  }, [list]);

  const overlays = useMemo(() => MAIN_OVERLAY_GROUP.slice(), []);

  // Sync panelStore with current map (initial load & external migrations)
  const prevMapRef = useRef<Record<number, boolean> | null>(null);
  useEffect(() => {
    const prev = prevMapRef.current ?? {};
    // @debug: PANEL_TREE sync
    dbg('sync panelStore (prev → next)', { prev: fmtMap(prev), next: fmtMap(map) });
    diffAndPublish(prev, map);
    prevMapRef.current = map;
  }, [map]);

  // If multiple overlays visible, collapse to the first (and publish)
  useEffect(() => {
    const visible = overlays.filter((id) => !!map[id]);
    if (visible.length <= 1) return;

    const keep = visible[0];
    // @debug: PANEL_TREE reconcile
    dbg('reconcile overlays: multiple visible → collapsing', {
      visible: visible.map((id) => SP_COIN_DISPLAY[id]),
      keep: SP_COIN_DISPLAY[keep],
    });

    schedule(() => {
      setExchangeContext((prev) => {
        const flatPrev = flatten((prev as any)?.settings?.spCoinPanelTree);
        const next = flatPrev.map((e) =>
          overlays.includes(e.panel) ? { ...e, visible: e.panel === keep } : e
        );
        // @debug: PANEL_TREE reconcile-diff
        dbg('reconcile diff', { prev: fmtMap(toMap(flatPrev)), next: fmtMap(toMap(next)) });
        diffAndPublish(toMap(flatPrev), toMap(next));
        return writeFlat(prev, next);
      }, 'usePanelTree:reconcile');
    });
  }, [map, overlays, setExchangeContext]);

  /* ------------------------------- queries ------------------------------- */

  const isVisible = useCallback((panel: SP_COIN_DISPLAY) => {
    const v = panelStore.isVisible(panel);
    // @debug: PANEL_TREE isVisible
    dbg(`isVisible(${SP_COIN_DISPLAY[panel]}) → ${v}`);
    return v;
  }, []);

  const getPanelChildren = useCallback((_parent: SP_COIN_DISPLAY) => [] as SP_COIN_DISPLAY[], []);

  /* ------------------------------- actions ------------------------------- */
  // NOTE: Added optional parentName to capture the source of the action.

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY, parentName?: string) => {
      // 🔊 Always log first (so console filters see it), and trace if enabled
      dbg(`openPanel(${SP_COIN_DISPLAY[panel]}) call`, { from: parentName ?? 'unknown' });
      traceIfEnabled(`openPanel(${SP_COIN_DISPLAY[panel]})`);

      if (!KNOWN.has(panel)) {
        dbg('⚠️ openPanel unknown id', { panel, from: parentName ?? 'unknown' });
        return;
      }

      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flatten((prev as any)?.settings?.spCoinPanelTree);
          let flat = ensurePanelPresent(flat0, panel);

          if (overlays.includes(panel)) {
            // @debug: PANEL_TREE open-overlay
            dbg(`open overlay (radio) ${SP_COIN_DISPLAY[panel]}`, {
              before: fmtMap(toMap(flat0)),
              from: parentName ?? 'unknown',
            });

            // radio: set ONLY this overlay to visible, others to false
            flat = overlays.reduce((acc, id) => {
              const idx = acc.findIndex((e) => e.panel === id);
              if (idx >= 0) acc[idx] = { ...acc[idx], visible: id === panel };
              else acc.push({ panel: id, visible: id === panel });
              return acc;
            }, [...flat]);

            const nextMap = toMap(flat);
            // @debug: PANEL_TREE open-overlay-after
            dbg('after open overlay', { map: fmtMap(nextMap), from: parentName ?? 'unknown' });
            diffAndPublish(toMap(flat0), nextMap);
            return writeFlat(prev, flat);
          }

          // non-radio: visible=true (idempotent)
          const nextFlat = [...flat];
          const i = nextFlat.findIndex((e) => e.panel === panel);
          if (i >= 0 && nextFlat[i].visible === true) {
            dbg(`open non-overlay (no-op) ${SP_COIN_DISPLAY[panel]}`, { from: parentName ?? 'unknown' });
            return prev;
          }
          if (i >= 0) nextFlat[i] = { ...nextFlat[i], visible: true };
          else nextFlat.push({ panel, visible: true });

          // @debug: PANEL_TREE open-non-overlay
          dbg(`open non-overlay ${SP_COIN_DISPLAY[panel]}`, {
            before: fmtMap(toMap(flat0)),
            after: fmtMap(toMap(nextFlat)),
            from: parentName ?? 'unknown',
          });

          diffAndPublish(toMap(flat0), toMap(nextFlat));
          return writeFlat(prev, nextFlat);
        }, `usePanelTree:open${parentName ? `:${parentName}` : ''}`);
      });
    },
    [setExchangeContext, overlays]
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY, parentName?: string) => {
      // 🔊 Always log first (so console filters see it), and trace if enabled
      dbg(`closePanel(${SP_COIN_DISPLAY[panel]}) call`, { from: parentName ?? 'unknown' });
      traceIfEnabled(`closePanel(${SP_COIN_DISPLAY[panel]})`);

      if (!KNOWN.has(panel)) {
        dbg('⚠️ closePanel unknown id', { panel, from: parentName ?? 'unknown' });
        return;
      }

      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flatten((prev as any)?.settings?.spCoinPanelTree);

          if (overlays.includes(panel)) {
            const isActive = !!flat0.find((e) => e.panel === panel && e.visible);

            // @debug: PANEL_TREE close-overlay
            dbg(`close overlay (radio) ${SP_COIN_DISPLAY[panel]}`, {
              active: isActive,
              before: fmtMap(toMap(flat0)),
              from: parentName ?? 'unknown',
            });

            if (isActive) {
              const next = overlays.reduce((acc, id) => {
                const idx = acc.findIndex((e) => e.panel === id);
                if (idx >= 0) acc[idx] = { ...acc[idx], visible: false };
                else acc.push({ panel: id, visible: false });
                return acc;
              }, [...flat0]);

              // @debug: PANEL_TREE close-overlay-after
              dbg('after close overlay', { map: fmtMap(toMap(next)), from: parentName ?? 'unknown' });
              diffAndPublish(toMap(flat0), toMap(next));
              return writeFlat(prev, next);
            }

            const nextFlat = flat0.map((e) => (e.panel === panel ? { ...e, visible: false } : e));
            // @debug: PANEL_TREE close-overlay-nonactive
            dbg('close overlay (non-active) result', {
              map: fmtMap(toMap(nextFlat)),
              from: parentName ?? 'unknown',
            });
            diffAndPublish(toMap(flat0), toMap(nextFlat));
            return writeFlat(prev, nextFlat);
          }

          const nextFlat = [...flat0];
          const i = nextFlat.findIndex((e) => e.panel === panel);
          if (i >= 0 && nextFlat[i].visible === false) {
            dbg(`close non-overlay (no-op) ${SP_COIN_DISPLAY[panel]}`, { from: parentName ?? 'unknown' });
            return prev;
          }
          if (i >= 0) nextFlat[i] = { ...nextFlat[i], visible: false };

          // @debug: PANEL_TREE close-non-overlay
          dbg(`close non-overlay ${SP_COIN_DISPLAY[panel]}`, {
            before: fmtMap(toMap(flat0)),
            after: fmtMap(toMap(nextFlat)),
            from: parentName ?? 'unknown',
          });

          diffAndPublish(toMap(flat0), toMap(nextFlat));
          return writeFlat(prev, nextFlat);
        }, `usePanelTree:close${parentName ? `:${parentName}` : ''}`);
      });
    },
    [setExchangeContext, overlays]
  );

  /* ------------------------------- derived -------------------------------- */

  const activeMainOverlay = useMemo<SP_COIN_DISPLAY | null>(() => {
    for (const id of overlays) if (map[id]) return id;
    return null;
  }, [map, overlays]);

  const isTokenScrollVisible = useMemo(
    () => map[SP_COIN_DISPLAY.BUY_SELECT_PANEL] || map[SP_COIN_DISPLAY.SELL_SELECT_PANEL],
    [map]
  );

  return {
    activeMainOverlay,
    isVisible,
    isTokenScrollVisible,
    getPanelChildren,
    openPanel,   // (panel, parentName?)
    closePanel,  // (panel, parentName?)
  };
}
