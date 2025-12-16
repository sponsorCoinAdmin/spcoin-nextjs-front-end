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

  // De-dupe by panel id (keep first occurrence)
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

function diffAndPublish(
  prevMap: Record<number, boolean>,
  nextMap: Record<number, boolean>,
) {
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

  // Scoped overlays for MANAGE_SPONSORSHIPS container
  const manageContainer = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS;
  const manageScoped = useMemo<SP_COIN_DISPLAY[]>(() => {
    const kids = (CHILDREN as any)?.[manageContainer] as
      | SP_COIN_DISPLAY[]
      | undefined;
    return Array.isArray(kids) ? kids.slice() : [];
  }, [manageContainer]);

  const manageScopedSet = useMemo(
    () => new Set<number>(manageScoped as unknown as number[]),
    [manageScoped],
  );

  // ✅ All descendants of MANAGE_SPONSORSHIPS (handles nested sponsor detail)
  const manageDescendantsSet = useMemo(() => {
    const out = new Set<number>();
    const stack: number[] = [Number(manageContainer)];

    while (stack.length) {
      const cur = stack.pop() as number;
      const kids =
        ((CHILDREN as any)?.[cur] as SP_COIN_DISPLAY[] | undefined) ?? [];
      for (const k of kids) {
        const kn = Number(k);
        if (!KNOWN.has(kn)) continue;
        if (!out.has(kn)) {
          out.add(kn);
          stack.push(kn);
        }
      }
    }

    out.delete(Number(manageContainer));
    return out;
  }, [manageContainer]);

  const isGlobalOverlay = useCallback(
    (p: SP_COIN_DISPLAY) => overlays.includes(p),
    [overlays],
  );

  // Normalize `name` consistently whenever we touch an entry.
  const withName = useCallback(
    (e: PanelEntry) => ({ ...e, name: e.name ?? panelName(e.panel) }),
    [],
  );

  // ───────────────────────── parent return tracking ─────────────────────────

  const DEFAULT_MANAGE_CHILD = SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL;
  const MANAGE_SPONSOR_PANEL = SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL;

  const SPONSOR_ALLOWED_PARENTS = useMemo(
    () =>
      new Set<number>([
        SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL,
        SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL,
      ]),
    [],
  );

  // Radio-children are ALL manage direct children except the sponsor detail panel.
  const isManageRadioChild = useCallback(
    (p: SP_COIN_DISPLAY) =>
      manageScopedSet.has(Number(p)) && Number(p) !== Number(MANAGE_SPONSOR_PANEL),
    [manageScopedSet, MANAGE_SPONSOR_PANEL],
  );

  // Any manage child (including descendants like sponsor detail)
  const isManageAnyChild = useCallback(
    (p: SP_COIN_DISPLAY) => manageDescendantsSet.has(Number(p)),
    [manageDescendantsSet],
  );

  // Store the last parent so sponsor close can return correctly.
  const sponsorParentRef = useRef<SP_COIN_DISPLAY | null>(null);

  const pickSponsorParent = useCallback(
    (flat0: PanelEntry[], explicit?: SP_COIN_DISPLAY): SP_COIN_DISPLAY => {
      const explicitOk =
        typeof explicit === 'number' &&
        SPONSOR_ALLOWED_PARENTS.has(Number(explicit));
      if (explicitOk) return explicit as SP_COIN_DISPLAY;

      // ✅ If we already have a remembered allowed parent, keep it.
      const remembered = sponsorParentRef.current;
      if (
        typeof remembered === 'number' &&
        SPONSOR_ALLOWED_PARENTS.has(Number(remembered))
      ) {
        return remembered;
      }

      // Fallback: infer from currently-visible allowed parent.
      const m0 = toMap(flat0);
      for (const idNum of SPONSOR_ALLOWED_PARENTS) {
        if (m0[idNum]) return idNum as SP_COIN_DISPLAY;
      }

      return DEFAULT_MANAGE_CHILD;
    },
    [SPONSOR_ALLOWED_PARENTS],
  );

  const closeManageBranch = useCallback(
    (arr: PanelEntry[]) =>
      arr.map((e) => {
        if (e.panel === manageContainer) return { ...withName(e), visible: false };
        if (isManageAnyChild(e.panel)) return { ...withName(e), visible: false };
        return e;
      }),
    [manageContainer, isManageAnyChild, withName],
  );

  const applyGlobalRadio = useCallback(
    (accIn: PanelEntry[], target: SP_COIN_DISPLAY) => {
      return overlays.reduce((acc, id) => {
        const idx = acc.findIndex((e) => e.panel === id);
        if (idx >= 0) {
          acc[idx] = { ...withName(acc[idx]), visible: id === target };
        } else {
          acc.push({
            panel: id as SP_COIN_DISPLAY,
            visible: id === target,
            name: panelName(id),
          });
        }
        return acc;
      }, [...accIn]);
    },
    [overlays, withName],
  );

  // Sets the scoped radio target among manage radio children.
  // NOTE: does NOT toggle MANAGE_SPONSOR_PANEL.
  const setScopedRadio = useCallback(
    (
      flatIn: PanelEntry[],
      makeVisible: SP_COIN_DISPLAY,
      alsoEnsureContainer = true,
    ) => {
      let next = flatIn;
      if (alsoEnsureContainer) next = ensurePanelPresent(next, manageContainer);
      next = ensurePanelPresent(next, makeVisible);

      return next.map((e) => {
        if (e.panel === manageContainer) {
          return { ...withName(e), visible: alsoEnsureContainer ? true : e.visible };
        }
        if (isManageRadioChild(e.panel)) {
          return { ...withName(e), visible: e.panel === makeVisible };
        }
        return e;
      });
    },
    [manageContainer, isManageRadioChild, withName],
  );

  /* ------------------ keep panelStore in sync with computed map ------------------ */

  const prevMapRef = useRef<Record<number, boolean> | null>(null);
  useEffect(() => {
    const prev = prevMapRef.current ?? {};
    diffAndPublish(prev, map);
    prevMapRef.current = map;
  }, [map]);

  /* ------------------ enforce single global overlay visible ------------------ */

  useEffect(() => {
    const visible = overlays.filter((id) => !!map[id]);
    if (visible.length <= 1) return;

    const keep = visible[0];

    schedule(() => {
      setExchangeContext((prev) => {
        const flatPrev = flatten((prev as any)?.settings?.spCoinPanelTree);
        let next = flatPrev.map((e) =>
          overlays.includes(e.panel)
            ? { ...withName(e), visible: e.panel === keep }
            : e,
        );

        // If manage container isn't kept, shut down the whole manage branch.
        if (keep !== manageContainer) next = closeManageBranch(next);

        diffAndPublish(toMap(flatPrev), toMap(next));
        return writeFlat(prev, next);
      });
    });
  }, [map, overlays, setExchangeContext, manageContainer, closeManageBranch, withName]);

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
    (panel: SP_COIN_DISPLAY, invoker?: string, parent?: SP_COIN_DISPLAY) => {
      logAction('openPanel', panel, invoker);
      if (!KNOWN.has(Number(panel))) return;

      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flatten((prev as any)?.settings?.spCoinPanelTree);

          const openingManageContainer = Number(panel) === Number(manageContainer);
          const openingGlobal = isGlobalOverlay(panel);
          const openingSponsorDetail = Number(panel) === Number(MANAGE_SPONSOR_PANEL);
          const openingManageRadioChild = isManageRadioChild(panel);

          // ✅ Remember last allowed parent whenever user opens those radio children.
          if (openingManageRadioChild && SPONSOR_ALLOWED_PARENTS.has(Number(panel))) {
            sponsorParentRef.current = panel;
          }

          // Track parent for sponsor detail so close can return correctly.
          if (openingSponsorDetail) {
            sponsorParentRef.current = pickSponsorParent(flat0, parent);
          }

          let flat = ensurePanelPresent(flat0, panel);

          // ✅ Opening sponsor detail: keep parent visible
          if (openingSponsorDetail) {
            const parentPanel = sponsorParentRef.current ?? DEFAULT_MANAGE_CHILD;

            flat = ensurePanelPresent(flat, manageContainer);
            flat = applyGlobalRadio(flat, manageContainer);

            let next = setScopedRadio(flat, parentPanel, true);

            next = ensurePanelPresent(next, MANAGE_SPONSOR_PANEL);
            next = next.map((e) =>
              e.panel === MANAGE_SPONSOR_PANEL
                ? { ...withName(e), visible: true }
                : e,
            );

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          // Opening a manage radio child: enforce radio; sponsor detail OFF
          if (openingManageRadioChild) {
            flat = ensurePanelPresent(flat, manageContainer);
            flat = applyGlobalRadio(flat, manageContainer);

            let next = setScopedRadio(flat, panel, true);

            next = next.map((e) =>
              e.panel === MANAGE_SPONSOR_PANEL ? { ...withName(e), visible: false } : e,
            );

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          // Opening manage container: ensure default radio child; sponsor detail OFF
          if (openingManageContainer) {
            flat = ensurePanelPresent(flat, manageContainer);
            flat = applyGlobalRadio(flat, manageContainer);

            const map0 = toMap(flat);
            const anyChildVisible = manageScoped.some((id) => !!map0[Number(id)]);

            let next = flat;
            if (!anyChildVisible) {
              next = setScopedRadio(flat, DEFAULT_MANAGE_CHILD, true);
            } else {
              next = flat.map((e) =>
                e.panel === manageContainer ? { ...withName(e), visible: true } : e,
              );
            }

            next = next.map((e) =>
              e.panel === MANAGE_SPONSOR_PANEL ? { ...withName(e), visible: false } : e,
            );

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          // Opening any other GLOBAL overlay: apply global radio; close manage branch
          if (openingGlobal) {
            let next = applyGlobalRadio(flat, panel);
            if (Number(panel) !== Number(manageContainer)) next = closeManageBranch(next);

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          // Non-overlay: simple open
          const nextFlat = flat.map((e) =>
            e.panel === panel ? { ...withName(e), visible: true } : e,
          );

          diffAndPublish(toMap(flat0), toMap(nextFlat));
          return writeFlat(prev, nextFlat);
        });
      });
    },
    [
      setExchangeContext,
      overlays,
      manageContainer,
      manageScoped,
      applyGlobalRadio,
      closeManageBranch,
      isGlobalOverlay,
      isManageRadioChild,
      withName,
      pickSponsorParent,
      setScopedRadio,
      DEFAULT_MANAGE_CHILD,
      MANAGE_SPONSOR_PANEL,
      SPONSOR_ALLOWED_PARENTS,
    ],
  );

  const closePanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string) => {
      logAction('closePanel', panel, invoker);
      if (!KNOWN.has(Number(panel))) return;

      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flatten((prev as any)?.settings?.spCoinPanelTree);

          const closingManageContainer = Number(panel) === Number(manageContainer);
          const closingGlobal = isGlobalOverlay(panel);
          const closingSponsorDetail = Number(panel) === Number(MANAGE_SPONSOR_PANEL);
          const closingManageRadioChild = isManageRadioChild(panel);

          if (closingManageContainer) {
            const next = closeManageBranch(
              flat0.map((e) =>
                e.panel === manageContainer ? { ...withName(e), visible: false } : e,
              ),
            );

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          if (closingSponsorDetail) {
            const targetAfterClose = sponsorParentRef.current ?? DEFAULT_MANAGE_CHILD;
            const containerIsVisible = !!toMap(flat0)[Number(manageContainer)];

            let next = flat0.map((e) =>
              e.panel === MANAGE_SPONSOR_PANEL ? { ...withName(e), visible: false } : e,
            );

            if (containerIsVisible) {
              next = applyGlobalRadio(next, manageContainer);
              next = setScopedRadio(next, targetAfterClose, true);
            }

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          if (closingManageRadioChild) {
            const containerIsVisible = !!toMap(flat0)[Number(manageContainer)];

            let next = flat0.map((e) =>
              e.panel === panel ? { ...withName(e), visible: false } : e,
            );

            next = next.map((e) =>
              e.panel === MANAGE_SPONSOR_PANEL ? { ...withName(e), visible: false } : e,
            );

            if (containerIsVisible) {
              next = applyGlobalRadio(next, manageContainer);
              next = setScopedRadio(next, DEFAULT_MANAGE_CHILD, true);
            }

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          if (closingGlobal) {
            const closingIsManage = Number(panel) === Number(manageContainer);

            let next = overlays.reduce((acc, id) => {
              const idx = acc.findIndex((e) => e.panel === id);
              if (idx >= 0) {
                acc[idx] = { ...withName(acc[idx]), visible: false };
              } else {
                acc.push({
                  panel: id as SP_COIN_DISPLAY,
                  visible: false,
                  name: panelName(id),
                });
              }
              return acc;
            }, [...flat0]);

            if (!closingIsManage) next = closeManageBranch(next);

            diffAndPublish(toMap(flat0), toMap(next));
            return writeFlat(prev, next);
          }

          const nextFlat = flat0.map((e) =>
            e.panel === panel ? { ...withName(e), visible: false } : e,
          );

          diffAndPublish(toMap(flat0), toMap(nextFlat));
          return writeFlat(prev, nextFlat);
        });
      });
    },
    [
      setExchangeContext,
      overlays,
      manageContainer,
      closeManageBranch,
      isGlobalOverlay,
      isManageRadioChild,
      withName,
      applyGlobalRadio,
      setScopedRadio,
      DEFAULT_MANAGE_CHILD,
      MANAGE_SPONSOR_PANEL,
    ],
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
