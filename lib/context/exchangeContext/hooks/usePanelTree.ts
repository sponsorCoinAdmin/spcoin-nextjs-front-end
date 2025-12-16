// File: @/lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import {
  MAIN_OVERLAY_GROUP,
  PANEL_DEFS,
  CHILDREN,
} from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { panelStore } from '@/lib/context/exchangeContext/panelStore';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const KNOWN = new Set<number>(PANEL_DEFS.map((d) => d.id));

type PanelEntry = {
  panel: SP_COIN_DISPLAY;
  visible: boolean;
  name?: string;
};

/* ------------------------------ debug helpers ------------------------------ */

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_OVERLAYS === 'true';

const debugLog = createDebugLogger('usePanelTree', DEBUG_ENABLED, LOG_TIME);

function logAction(
  kind: 'openPanel' | 'closePanel',
  panel: SP_COIN_DISPLAY,
  invoker?: string,
) {
  if (!DEBUG_ENABLED) return;
  debugLog.log?.('[usePanelTree] action', {
    kind,
    panel: SP_COIN_DISPLAY[panel],
    invoker: invoker ?? 'unknown',
  });
}

/* ------------------------------ helpers ------------------------------ */

const schedule = (fn: () => void) =>
  typeof queueMicrotask === 'function' ? queueMicrotask(fn) : setTimeout(fn, 0);

const panelName = (id: number) => SP_COIN_DISPLAY[id] ?? String(id);

function flatten(nodes: any[] | undefined): PanelEntry[] {
  if (!Array.isArray(nodes)) return [];
  const out: PanelEntry[] = [];
  const walk = (ns: any[]) => {
    for (const n of ns) {
      const id = typeof n?.panel === 'number' ? (n.panel as number) : NaN;
      if (!Number.isFinite(id) || !KNOWN.has(id)) continue;

      const name =
        typeof n?.name === 'string' && n.name.length > 0
          ? (n.name as string)
          : panelName(id);

      out.push({ panel: id as SP_COIN_DISPLAY, visible: !!n.visible, name });
      if (Array.isArray(n.children) && n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  const seen = new Set<number>();
  return out.filter((e) =>
    seen.has(e.panel) ? false : (seen.add(e.panel), true),
  );
}

function toMap(list: PanelEntry[]): Record<number, boolean> {
  const m: Record<number, boolean> = {};
  for (const e of list) m[e.panel] = !!e.visible;
  return m;
}

function writeFlat(prevCtx: any, next: PanelEntry[]) {
  const withNames = next.map((e) => ({
    panel: e.panel,
    visible: !!e.visible,
    name: e.name ?? panelName(e.panel),
  }));
  return {
    ...prevCtx,
    settings: { ...(prevCtx?.settings ?? {}), spCoinPanelTree: withNames },
  };
}

function ensurePanelPresent(list: PanelEntry[], panel: SP_COIN_DISPLAY): PanelEntry[] {
  return list.some((e) => e.panel === panel)
    ? list
    : [...list, { panel, visible: false, name: panelName(panel) }];
}

function diffAndPublish(prevMap: Record<number, boolean>, nextMap: Record<number, boolean>) {
  const ids = new Set<number>([
    ...Object.keys(prevMap),
    ...Object.keys(nextMap),
  ].map(Number));
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

  const list = useMemo<PanelEntry[]>(
    () => flatten((exchangeContext as any)?.settings?.spCoinPanelTree),
    [exchangeContext],
  );

  const map = useMemo(() => toMap(list), [list]);

  // Global overlays (top-level radio)
  const overlays = useMemo(() => MAIN_OVERLAY_GROUP.slice(), []);

  // ✅ Scoped overlays for MANAGE_SPONSORSHIPS container
  const manageContainer = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS;
  const manageScoped = useMemo<SP_COIN_DISPLAY[]>(() => {
    const kids = (CHILDREN as any)?.[manageContainer] as
      | SP_COIN_DISPLAY[]
      | undefined;
    return Array.isArray(kids) ? kids.slice() : [];
  }, [manageContainer]);

  // Keep panelStore in sync with computed map
  const prevMapRef = useRef<Record<number, boolean> | null>(null);
  useEffect(() => {
    const prev = prevMapRef.current ?? {};
    diffAndPublish(prev, map);
    prevMapRef.current = map;
  }, [map]);

  // If multiple GLOBAL overlays visible, collapse to the first.
  // ✅ IMPORTANT: if the kept overlay is NOT the manage container,
  // force-close manage container + children so UI never shows stale manage panels.
  useEffect(() => {
    const visible = overlays.filter((id) => !!map[id]);
    if (visible.length <= 1) return;

    const keep = visible[0];

    schedule(() => {
      setExchangeContext((prev) => {
        const flatPrev = flatten((prev as any)?.settings?.spCoinPanelTree);
        let next = flatPrev.map((e) =>
          overlays.includes(e.panel)
            ? {
              ...e,
              visible: e.panel === keep,
              name: e.name ?? panelName(e.panel),
            }
            : e,
        );

        // If manage container is not kept, ensure it and its children are off.
        if (keep !== manageContainer) {
          next = next.map((e) => {
            if (e.panel === manageContainer) {
              return { ...e, visible: false, name: e.name ?? panelName(e.panel) };
            }
            if (manageScoped.includes(e.panel)) {
              return { ...e, visible: false, name: e.name ?? panelName(e.panel) };
            }
            return e;
          });
        }

        diffAndPublish(toMap(flatPrev), toMap(next));
        return writeFlat(prev, next);
      });
    });
  }, [map, overlays, setExchangeContext, manageContainer, manageScoped]);

  /* ------------------------------- queries ------------------------------- */

  const isVisible = useCallback((panel: SP_COIN_DISPLAY) => {
    return panelStore.isVisible(panel);
  }, []);

  const getPanelChildren = useCallback(
    (invoker: SP_COIN_DISPLAY) =>
      ((CHILDREN as any)?.[invoker] as SP_COIN_DISPLAY[] | undefined) ?? [],
    [],
  );

  /* ------------------------------- actions ------------------------------- */

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string) => {
      logAction('openPanel', panel, invoker);
      if (!KNOWN.has(panel)) return;

      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flatten((prev as any)?.settings?.spCoinPanelTree);
          let flat = ensurePanelPresent(flat0, panel);

          const isGlobalOverlay = overlays.includes(panel);
          const isManageChild = manageScoped.includes(panel);
          const isManageContainer = panel === manageContainer;

          // Helper: apply GLOBAL radio so only `target` is on.
          const applyGlobalRadio = (accIn: PanelEntry[], target: SP_COIN_DISPLAY) => {
            return overlays.reduce((acc, id) => {
              const idx = acc.findIndex((e) => e.panel === id);
              if (idx >= 0) {
                acc[idx] = {
                  ...acc[idx],
                  visible: id === target,
                  name: acc[idx].name ?? panelName(id),
                };
              } else {
                acc.push({
                  panel: id as SP_COIN_DISPLAY,
                  visible: id === target,
                  name: panelName(id),
                });
              }
              return acc;
            }, [...accIn]);
          };

          // ✅ Opening a scoped manage child:
          // 1) Make MANAGE_SPONSORSHIPS the active GLOBAL overlay (close other root overlays)
          // 2) Keep container visible
          // 3) Enforce scoped radio among manage children
          if (isManageChild) {
            flat = ensurePanelPresent(flat, manageContainer);
            flat = applyGlobalRadio(flat, manageContainer);

            const next = [...flat].map((e) => {
              if (e.panel === manageContainer) {
                return {
                  ...e,
                  visible: true,
                  name: e.name ?? panelName(e.panel),
                };
              }
              if (manageScoped.includes(e.panel)) {
                return {
                  ...e,
                  visible: e.panel === panel,
                  name: e.name ?? panelName(e.panel),
                };
              }
              return e;
            });

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          // ✅ Opening the manage container itself:
          // 1) Make it the active GLOBAL overlay (close other root overlays)
          // 2) If no child active, open MANAGE_SPONSORSHIPS_PANEL ONCE on entry
          if (isManageContainer) {
            flat = ensurePanelPresent(flat, manageContainer);
            flat = applyGlobalRadio(flat, manageContainer);

            const map0 = toMap(flat);
            const anyChildVisible = manageScoped.some((id) => !!map0[id]);
            const defaultChild = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;

            let next = [...flat].map((e) => {
              if (e.panel === manageContainer) {
                return {
                  ...e,
                  visible: true,
                  name: e.name ?? panelName(e.panel),
                };
              }
              if (!anyChildVisible && e.panel === defaultChild) {
                return {
                  ...e,
                  visible: true,
                  name: e.name ?? panelName(e.panel),
                };
              }
              return e;
            });

            if (!anyChildVisible && !next.some((e) => e.panel === defaultChild)) {
              next.push({
                panel: defaultChild,
                visible: true,
                name: panelName(defaultChild),
              });
            }

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          // ✅ Opening any OTHER global overlay:
          // Apply global radio, AND force-close manage container + its children.
          if (isGlobalOverlay) {
            let next = applyGlobalRadio(flat, panel);

            if (Number(panel) !== Number(manageContainer)) {
              next = next.map((e) => {
                if (e.panel === manageContainer) {
                  return { ...e, visible: false, name: e.name ?? panelName(e.panel) };
                }
                if (manageScoped.includes(e.panel)) {
                  return { ...e, visible: false, name: e.name ?? panelName(e.panel) };
                }
                return e;
              });
            }

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          // Non-overlay: simple open
          const nextFlat = [...flat];
          const i = nextFlat.findIndex((e) => e.panel === panel);
          if (i >= 0 && nextFlat[i].visible === true) return prev;
          if (i >= 0) {
            nextFlat[i] = {
              ...nextFlat[i],
              visible: true,
              name: nextFlat[i].name ?? panelName(panel),
            };
          } else {
            nextFlat.push({ panel, visible: true, name: panelName(panel) });
          }

          diffAndPublish(toMap(flat0), toMap(nextFlat));
          return writeFlat(prev, nextFlat);
        });
      });
    },
    [setExchangeContext, overlays, manageScoped, manageContainer],
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string) => {
      logAction('closePanel', panel, invoker);
      if (!KNOWN.has(panel)) return;

      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flatten((prev as any)?.settings?.spCoinPanelTree);

          const isManageChild = manageScoped.includes(panel);
          const isManageContainer = panel === manageContainer;

          // Closing container: hide container + all its scoped children
          if (isManageContainer) {
            const next = flat0.map((e) => {
              if (e.panel === manageContainer) {
                return { ...e, visible: false, name: e.name ?? panelName(e.panel) };
              }
              if (manageScoped.includes(e.panel)) {
                return { ...e, visible: false, name: e.name ?? panelName(e.panel) };
              }
              return e;
            });

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          // Closing scoped child: only hide that child (do NOT auto-default)
          if (isManageChild) {
            const next = flat0.map((e) =>
              e.panel === panel
                ? { ...e, visible: false, name: e.name ?? panelName(e.panel) }
                : e,
            );

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          // Global overlay close behavior
          if (overlays.includes(panel)) {
            // If closing a non-manage overlay, also ensure manage container+children off
            const closingIsManageContainer = Number(panel) === Number(manageContainer);

            let next = overlays.reduce((acc, id) => {
              const idx = acc.findIndex((e) => e.panel === id);
              if (idx >= 0) {
                acc[idx] = {
                  ...acc[idx],
                  visible: false,
                  name: acc[idx].name ?? panelName(id),
                };
              } else {
                acc.push({
                  panel: id as SP_COIN_DISPLAY,
                  visible: false,
                  name: panelName(id),
                });
              }
              return acc;
            }, [...flat0]);

            if (!closingIsManageContainer) {
              next = next.map((e) => {
                if (e.panel === manageContainer) {
                  return { ...e, visible: false, name: e.name ?? panelName(e.panel) };
                }
                if (manageScoped.includes(e.panel)) {
                  return { ...e, visible: false, name: e.name ?? panelName(e.panel) };
                }
                return e;
              });
            }

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          // Non-overlay close
          const nextFlat = flat0.map((e) =>
            e.panel === panel
              ? { ...e, visible: false, name: e.name ?? panelName(panel) }
              : e,
          );

          diffAndPublish(toMap(flat0), toMap(nextFlat));
          return writeFlat(prev, nextFlat);
        });
      });
    },
    [setExchangeContext, overlays, manageScoped, manageContainer],
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
    [map],
  );

  return {
    activeMainOverlay,
    isVisible,
    isTokenScrollVisible,
    getPanelChildren,
    openPanel,
    closePanel,
  };
}
