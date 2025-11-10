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

const PT_DEBUG =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
    process.env.NEXT_PUBLIC_DEBUG_LOG_OVERLAYS === 'true');

const PT_TRACE = false; // flip to true temporarily to see stack traces at call sites

function traceIfEnabled(label: string) {
  if (!PT_DEBUG || !PT_TRACE) return;
  // eslint-disable-next-line no-console
  console.trace(`[usePanelTree] ${label}`);
}

function logAction(kind: 'openPanel' | 'closePanel', panel: SP_COIN_DISPLAY, invoker?: string) {
  if (!PT_DEBUG) return;
  const panelName = SP_COIN_DISPLAY[panel];
  const invokerLabel = invoker ?? 'unknown';
  // eslint-disable-next-line no-console
  console.log(`[usePanelTree] ${kind}({panel: ${panelName}, invoker: '${invokerLabel}'})`);
}

/* ------------------------------ helpers ------------------------------ */

const schedule = (fn: () => void) =>
  typeof queueMicrotask === 'function' ? queueMicrotask(fn) : setTimeout(fn, 0); // post-commit scheduling

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
      panelStore.setVisible(id, next);
    }
  });
}

/* --------------------------------- hook --------------------------------- */

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const list = useMemo<PanelEntry[]>(
    () => flatten((exchangeContext as any)?.settings?.spCoinPanelTree),
    [exchangeContext]
  );

  const map = useMemo(() => toMap(list), [list]);

  const overlays = useMemo(() => MAIN_OVERLAY_GROUP.slice(), []);

  // Sync panelStore with current map (initial load & external migrations)
  const prevMapRef = useRef<Record<number, boolean> | null>(null);
  useEffect(() => {
    const prev = prevMapRef.current ?? {};
    diffAndPublish(prev, map);
    prevMapRef.current = map;
  }, [map]);

  // If multiple overlays visible, collapse to the first (and publish)
  useEffect(() => {
    const visible = overlays.filter((id) => !!map[id]);
    if (visible.length <= 1) return;

    const keep = visible[0];

    schedule(() => {
      setExchangeContext((prev) => {
        const flatPrev = flatten((prev as any)?.settings?.spCoinPanelTree);
        const next = flatPrev.map((e) =>
          overlays.includes(e.panel) ? { ...e, visible: e.panel === keep } : e
        );
        diffAndPublish(toMap(flatPrev), toMap(next));
        return writeFlat(prev, next);
      });
    });
  }, [map, overlays, setExchangeContext]);

  /* ------------------------------- queries ------------------------------- */

  const isVisible = useCallback((panel: SP_COIN_DISPLAY) => {
    return panelStore.isVisible(panel);
  }, []);

  // Placeholder for future tree-aware children lookup (kept for API stability)
  const getPanelChildren = useCallback((_invoker: SP_COIN_DISPLAY) => [] as SP_COIN_DISPLAY[], []);

  /* ------------------------------- actions ------------------------------- */

  // New, simplified signature:
  //   openPanel(panel, invoker?)
  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string) => {
      traceIfEnabled(`openPanel(${SP_COIN_DISPLAY[panel]})`);
      logAction('openPanel', panel, invoker);

      if (!KNOWN.has(panel)) {
        logAction('openPanel', panel, `unknown-id(${panel})`);
        return;
      }

      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flatten((prev as any)?.settings?.spCoinPanelTree);
          let flat = ensurePanelPresent(flat0, panel);

          if (overlays.includes(panel)) {
            flat = overlays.reduce((acc, id) => {
              const idx = acc.findIndex((e) => e.panel === id);
              if (idx >= 0) acc[idx] = { ...acc[idx], visible: id === panel };
              else acc.push({ panel: id, visible: id === panel });
              return acc;
            }, [...flat]);

            diffAndPublish(toMap(flat0), toMap(flat));
            return writeFlat(prev, flat);
          }

          const nextFlat = [...flat];
          const i = nextFlat.findIndex((e) => e.panel === panel);
          if (i >= 0 && nextFlat[i].visible === true) return prev; // idempotent
          if (i >= 0) nextFlat[i] = { ...nextFlat[i], visible: true };
          else nextFlat.push({ panel, visible: true });

          diffAndPublish(toMap(flat0), toMap(nextFlat));
          return writeFlat(prev, nextFlat);
        });
      });
    },
    [setExchangeContext, overlays]
  );

  // New, simplified signature:
  //   closePanel(panel, invoker?)
  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string) => {
      traceIfEnabled(`closePanel(${SP_COIN_DISPLAY[panel]})`);
      logAction('closePanel', panel, invoker);

      if (!KNOWN.has(panel)) {
        logAction('closePanel', panel, `unknown-id(${panel})`);
        return;
      }

      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flatten((prev as any)?.settings?.spCoinPanelTree);

          if (overlays.includes(panel)) {
            const isActive = !!flat0.find((e) => e.panel === panel && e.visible);
            if (isActive) {
              const next = overlays.reduce((acc, id) => {
                const idx = acc.findIndex((e) => e.panel === id);
                if (idx >= 0) acc[idx] = { ...acc[idx], visible: false };
                else acc.push({ panel: id, visible: false });
                return acc;
              }, [...flat0]);

              diffAndPublish(toMap(flat0), toMap(next));
              return writeFlat(prev, next);
            }

            const nextFlat = flat0.map((e) => (e.panel === panel ? { ...e, visible: false } : e));
            diffAndPublish(toMap(flat0), toMap(nextFlat));
            return writeFlat(prev, nextFlat);
          }

          const nextFlat = [...flat0];
          const i = nextFlat.findIndex((e) => e.panel === panel);
          if (i >= 0 && nextFlat[i].visible === false) return prev; // idempotent
          if (i >= 0) nextFlat[i] = { ...nextFlat[i], visible: false };

          diffAndPublish(toMap(flat0), toMap(nextFlat));
          return writeFlat(prev, nextFlat);
        });
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
    () =>
      map[SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL] ||
      map[SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL],
    [map]
  );

  return {
    activeMainOverlay,
    isVisible,
    isTokenScrollVisible,
    getPanelChildren,
    openPanel,   // (panel, invoker?)
    closePanel,  // (panel, invoker?)
  };
}
