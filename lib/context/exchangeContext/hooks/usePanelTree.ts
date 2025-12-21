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

import {
  type PanelEntry,
  flattenPanelTree,
  toVisibilityMap,
  ensurePanelPresent,
  writeFlatTree,
  panelName,
} from '@/lib/context/exchangeContext/panelTree/panelTreePersistence';

import {
  schedule,
  logAction,
} from '@/lib/context/exchangeContext/panelTree/panelTreeDebug';

import {
  applyGlobalRadio,
  clearGlobalRadio,
} from '@/lib/context/exchangeContext/panelTree/panelTreeRadio';

import {
  computeManageDescendantsSet,
  makeManagePredicates,
  closeManageBranch,
  setScopedRadio,
  pickSponsorParent,
  ensureManageContainerAndDefaultChild,
  type ManageScopeConfig,
} from '@/lib/context/exchangeContext/panelTree/panelTreeManageScope';

import {
  pushNav,
  removeNav,
  popTopIfMatches,
  peekNav,
  findLastInStack,
  seedNavStackFromVisibility,
  dumpNavStack,
} from '@/lib/context/exchangeContext/panelTree/panelNavStack';

const KNOWN = new Set<number>(PANEL_DEFS.map((d) => d.id));

// NOTE:
// - `allowEmptyRadio` is treated as ALWAYS TRUE.
// - Navigation is stack-driven, and the stack is a global singleton.
// - IMPORTANT BEHAVIOR CHANGE (bug fix): we ONLY auto-restore from stack when closing a RADIO
//   surface (global overlay / manage-scoped / manage sponsor detail / manage container).
//   For non-radio leaf panels, closing should not unexpectedly reopen something.

const DEBUG_STACK =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_OVERLAY_CLOSE === 'true';

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

const nameOf = (id: SP_COIN_DISPLAY) => SP_COIN_DISPLAY[id] ?? String(id);

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const list = useMemo<PanelEntry[]>(
    () =>
      flattenPanelTree(
        (exchangeContext as any)?.settings?.spCoinPanelTree,
        KNOWN,
      ),
    [exchangeContext],
  );

  const map = useMemo(() => toVisibilityMap(list), [list]);

  // Global overlays (top-level radio)
  const overlays = useMemo(() => MAIN_OVERLAY_GROUP.slice(), []);

  // ───────────────────────── Manage scope config ─────────────────────────

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

  const manageCfg: ManageScopeConfig = useMemo(
    () => ({
      known: KNOWN,
      children: CHILDREN as any,
      manageContainer,
      manageScoped,
      defaultManageChild: SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
      manageSponsorPanel: SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
      sponsorAllowedParents: new Set<number>([
        SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL,
        SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL,
      ]),
    }),
    [manageContainer, manageScoped],
  );

  const manageDescendantsSet = useMemo(
    () => computeManageDescendantsSet(manageCfg),
    [manageCfg],
  );

  const { isManageRadioChild, isManageAnyChild } = useMemo(
    () => makeManagePredicates(manageCfg, manageScopedSet, manageDescendantsSet),
    [manageCfg, manageScopedSet, manageDescendantsSet],
  );

  const isGlobalOverlay = useCallback(
    (p: SP_COIN_DISPLAY) => overlays.includes(p),
    [overlays],
  );

  const withName = useCallback(
    (e: PanelEntry) => ({ ...e, name: e.name ?? panelName(e.panel) }),
    [],
  );

  // ───────────────────────── Seed global nav stack ─────────────────────────
  // If panels are visible due to persisted state, we need an initial stack.
  useEffect(() => {
    seedNavStackFromVisibility({
      map,
      overlays,
      manageContainer: manageCfg.manageContainer,
      manageScoped,
      manageSponsorPanel: manageCfg.manageSponsorPanel,
    });
  }, [
    map,
    overlays,
    manageCfg.manageContainer,
    manageCfg.manageSponsorPanel,
    manageScoped,
  ]);

  // ───────────────────────── Parents lookup (multi-parent support) ─────────────────────────

  const parentsOf = useMemo(() => {
    const m = new Map<number, number[]>();
    const entries = Object.entries(CHILDREN as any);
    for (const [parentKey, kids] of entries) {
      const parentId = Number(parentKey);
      if (!Array.isArray(kids)) continue;
      for (const k of kids) {
        const childId = Number(k);
        const arr = m.get(childId) ?? [];
        if (!arr.includes(parentId)) arr.push(parentId);
        m.set(childId, arr);
      }
    }
    return m;
  }, []);

  const pickParentForChild = useCallback(
    (child: SP_COIN_DISPLAY, visMap: Record<number, boolean>): SP_COIN_DISPLAY | null => {
      const parents = parentsOf.get(Number(child)) ?? [];
      if (!parents.length) return null;

      // 1) Prefer last parent in the nav stack.
      const fromStack = findLastInStack(new Set<number>(parents));
      if (fromStack) return fromStack;

      // 2) Prefer currently visible parent.
      for (const p of parents) {
        if (visMap[p]) return p as SP_COIN_DISPLAY;
      }

      // 3) Fallback.
      return parents[0] as SP_COIN_DISPLAY;
    },
    [parentsOf],
  );

  // sponsor parent tracking (still useful for sponsor detail activation fallback)
  const sponsorParentRef = useRef<SP_COIN_DISPLAY | null>(null);

  // manage scoped history (kept for now; may be retired later)
  const manageScopedHistoryRef = useRef<SP_COIN_DISPLAY[]>([]);

  const getActiveManageScoped = useCallback(
    (flat: PanelEntry[]) => {
      const m = toVisibilityMap(flat);
      for (const id of manageScoped) {
        if (m[Number(id)]) return id;
      }
      return null;
    },
    [manageScoped],
  );

  const pushManageScopedHistory = useCallback(
    (prevScoped: SP_COIN_DISPLAY | null, nextScoped: SP_COIN_DISPLAY) => {
      if (!prevScoped) return;
      if (Number(prevScoped) === Number(nextScoped)) return;
      const stack = manageScopedHistoryRef.current;
      if (
        stack.length &&
        Number(stack[stack.length - 1]) === Number(prevScoped)
      ) {
        return;
      }
      stack.push(prevScoped);
    },
    [],
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
        const flatPrev = flattenPanelTree(
          (prev as any)?.settings?.spCoinPanelTree,
          KNOWN,
        );

        let next = flatPrev.map((e) =>
          overlays.includes(e.panel)
            ? { ...withName(e), visible: e.panel === keep }
            : e,
        );

        if (keep !== manageCfg.manageContainer) {
          manageScopedHistoryRef.current = [];
          next = closeManageBranch(next, manageCfg, isManageAnyChild, withName);
        }

        diffAndPublish(toVisibilityMap(flatPrev), toVisibilityMap(next));
        return writeFlatTree(prev, next);
      });
    });
  }, [map, overlays, setExchangeContext, manageCfg, isManageAnyChild, withName]);

  /* ------------------------------- queries ------------------------------- */

  const isVisible = useCallback((panel: SP_COIN_DISPLAY) => {
    return panelStore.isVisible(panel);
  }, []);

  const getPanelChildren = useCallback(
    (invoker: SP_COIN_DISPLAY) =>
      ((CHILDREN as any)?.[invoker] as SP_COIN_DISPLAY[] | undefined) ?? [],
    [],
  );

  /* ----------------------- activation helpers (stack restore) ----------------------- */

  const activatePanel = useCallback(
    (flat0: PanelEntry[], target: SP_COIN_DISPLAY): PanelEntry[] => {
      let flat = ensurePanelPresent(flat0, target);

      const targetIsGlobal = isGlobalOverlay(target);
      const targetIsManageScoped = isManageRadioChild(target);
      const targetIsManageContainer =
        Number(target) === Number(manageCfg.manageContainer);
      const targetIsSponsorDetail =
        Number(target) === Number(manageCfg.manageSponsorPanel);

      // 1) Global overlay target
      if (targetIsGlobal) {
        flat = applyGlobalRadio(flat, overlays, target, withName);
        return flat;
      }

      // 2) Manage container target
      if (targetIsManageContainer) {
        flat = ensurePanelPresent(flat, manageCfg.manageContainer);
        flat = applyGlobalRadio(
          flat,
          overlays,
          manageCfg.manageContainer,
          withName,
        );

        const lastScoped =
          findLastInStack(manageScopedSet) ?? manageCfg.defaultManageChild;

        const setScoped = (fi: PanelEntry[], p: SP_COIN_DISPLAY) =>
          setScopedRadio(fi, p, manageCfg, isManageRadioChild, withName, true);

        flat = ensureManageContainerAndDefaultChild(
          flat,
          manageCfg,
          withName,
          setScoped,
        );
        flat = setScoped(flat, lastScoped);

        // Sponsor detail OFF by default
        flat = flat.map((e) =>
          e.panel === manageCfg.manageSponsorPanel
            ? { ...withName(e), visible: false }
            : e,
        );

        return flat;
      }

      // 3) Manage-scoped child target
      if (targetIsManageScoped) {
        flat = ensurePanelPresent(flat, manageCfg.manageContainer);
        flat = applyGlobalRadio(
          flat,
          overlays,
          manageCfg.manageContainer,
          withName,
        );
        flat = setScopedRadio(
          flat,
          target,
          manageCfg,
          isManageRadioChild,
          withName,
          true,
        );

        // Sponsor detail OFF
        flat = flat.map((e) =>
          e.panel === manageCfg.manageSponsorPanel
            ? { ...withName(e), visible: false }
            : e,
        );

        return flat;
      }

      // 4) Sponsor detail target
      if (targetIsSponsorDetail) {
        flat = ensurePanelPresent(flat, manageCfg.manageContainer);
        flat = applyGlobalRadio(
          flat,
          overlays,
          manageCfg.manageContainer,
          withName,
        );

        const lastScoped =
          findLastInStack(manageScopedSet, manageCfg.manageSponsorPanel) ??
          sponsorParentRef.current ??
          manageCfg.defaultManageChild;

        flat = setScopedRadio(
          flat,
          lastScoped,
          manageCfg,
          isManageRadioChild,
          withName,
          true,
        );

        flat = ensurePanelPresent(flat, manageCfg.manageSponsorPanel);
        flat = flat.map((e) =>
          e.panel === manageCfg.manageSponsorPanel
            ? { ...withName(e), visible: true }
            : e,
        );

        return flat;
      }

      // 5) Regular panels: ensure required parents (multi-parent aware)
      const vis0 = toVisibilityMap(flat);
      const chain: SP_COIN_DISPLAY[] = [];
      let cur: SP_COIN_DISPLAY = target;
      const seen = new Set<number>([Number(cur)]);

      while (parentsOf.has(Number(cur))) {
        const p = pickParentForChild(cur, vis0);
        if (!p) break;
        if (seen.has(Number(p))) break;
        chain.push(p);
        seen.add(Number(p));
        cur = p;
      }

      for (let i = chain.length - 1; i >= 0; i--) {
        const p = chain[i] as SP_COIN_DISPLAY;

        if (isGlobalOverlay(p)) {
          const lastOverlay =
            findLastInStack(new Set<number>(overlays as unknown as number[])) ??
            p;
          flat = ensurePanelPresent(flat, lastOverlay);
          flat = applyGlobalRadio(flat, overlays, lastOverlay, withName);
          continue;
        }

        if (Number(p) === Number(manageCfg.manageContainer)) {
          flat = ensurePanelPresent(flat, manageCfg.manageContainer);
          flat = applyGlobalRadio(
            flat,
            overlays,
            manageCfg.manageContainer,
            withName,
          );
          continue;
        }

        if (isManageRadioChild(p)) {
          const lastScoped = findLastInStack(manageScopedSet) ?? p;
          flat = ensurePanelPresent(flat, manageCfg.manageContainer);
          flat = applyGlobalRadio(
            flat,
            overlays,
            manageCfg.manageContainer,
            withName,
          );
          flat = setScopedRadio(
            flat,
            lastScoped,
            manageCfg,
            isManageRadioChild,
            withName,
            true,
          );
          continue;
        }

        flat = ensurePanelPresent(flat, p);
        flat = flat.map((e) =>
          e.panel === p ? { ...withName(e), visible: true } : e,
        );
      }

      flat = ensurePanelPresent(flat, target);
      flat = flat.map((e) =>
        e.panel === target ? { ...withName(e), visible: true } : e,
      );

      return flat;
    },
    [
      overlays,
      manageCfg,
      manageScopedSet,
      isGlobalOverlay,
      isManageRadioChild,
      parentsOf,
      pickParentForChild,
      withName,
    ],
  );

  /**
   * Decide what we are allowed to restore after a close.
   *
   * Key fix:
   * - Only restore for RADIO surfaces.
   * - Restore target must be either a global overlay, manage container, manage scoped, or sponsor detail.
   * - If the stack top isn't one of those, do nothing.
   */
  const pickRestoreTargetAfterClose = useCallback(
    (closingPanel: SP_COIN_DISPLAY): SP_COIN_DISPLAY | null => {
      const top = peekNav();
      if (!top) return null;

      // Don’t immediately restore the same panel we just closed.
      if (Number(top) === Number(closingPanel)) return null;

      const isAllowed =
        isGlobalOverlay(top) ||
        Number(top) === Number(manageCfg.manageContainer) ||
        isManageRadioChild(top) ||
        Number(top) === Number(manageCfg.manageSponsorPanel);

      return isAllowed ? top : null;
    },
    [isGlobalOverlay, isManageRadioChild, manageCfg.manageContainer, manageCfg.manageSponsorPanel],
  );

  /* ------------------------------- actions ------------------------------- */

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY, invoker?: string, parent?: SP_COIN_DISPLAY) => {
      logAction('openPanel', panel, invoker);
      if (!KNOWN.has(Number(panel))) return;

      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flattenPanelTree(
            (prev as any)?.settings?.spCoinPanelTree,
            KNOWN,
          );

          const openingManageContainer =
            Number(panel) === Number(manageCfg.manageContainer);
          const openingGlobal = isGlobalOverlay(panel);
          const openingSponsorDetail =
            Number(panel) === Number(manageCfg.manageSponsorPanel);
          const openingManageRadioChild = isManageRadioChild(panel);

          // Stack: push only if changed
          pushNav(panel);

          if (DEBUG_STACK) {
            dumpNavStack({
              tag: `openPanel(${nameOf(panel)}) ${invoker ?? ''}`.trim(),
              map: toVisibilityMap(flat0),
              overlays,
              known: KNOWN,
            });
          }

          // Track parent for sponsor detail so close can return correctly.
          if (openingSponsorDetail) {
            sponsorParentRef.current = pickSponsorParent(
              flat0,
              manageCfg,
              sponsorParentRef,
              parent,
            );
          }

          let flat = ensurePanelPresent(flat0, panel);

          // Opening sponsor detail: keep parent visible
          if (openingSponsorDetail) {
            const parentPanel =
              sponsorParentRef.current ?? manageCfg.defaultManageChild;

            flat = ensurePanelPresent(flat, manageCfg.manageContainer);
            flat = applyGlobalRadio(
              flat,
              overlays,
              manageCfg.manageContainer,
              withName,
            );

            const setScoped = (fi: PanelEntry[], p: SP_COIN_DISPLAY) =>
              setScopedRadio(
                fi,
                p,
                manageCfg,
                isManageRadioChild,
                withName,
                true,
              );

            const prevScoped = getActiveManageScoped(flat0);
            pushManageScopedHistory(prevScoped, parentPanel);

            let next = setScoped(flat, parentPanel);

            next = ensurePanelPresent(next, manageCfg.manageSponsorPanel);
            next = next.map((e) =>
              e.panel === manageCfg.manageSponsorPanel
                ? { ...withName(e), visible: true }
                : e,
            );

            diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
            return writeFlatTree(prev, next);
          }

          // Opening a manage radio child: enforce scoped radio; sponsor detail OFF
          if (openingManageRadioChild) {
            const prevScoped = getActiveManageScoped(flat0);
            pushManageScopedHistory(prevScoped, panel);

            flat = ensurePanelPresent(flat, manageCfg.manageContainer);
            flat = applyGlobalRadio(
              flat,
              overlays,
              manageCfg.manageContainer,
              withName,
            );

            let next = setScopedRadio(
              flat,
              panel,
              manageCfg,
              isManageRadioChild,
              withName,
              true,
            );

            next = next.map((e) =>
              e.panel === manageCfg.manageSponsorPanel
                ? { ...withName(e), visible: false }
                : e,
            );

            diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
            return writeFlatTree(prev, next);
          }

          // Opening manage container: ensure default radio child; sponsor detail OFF
          if (openingManageContainer) {
            flat = ensurePanelPresent(flat, manageCfg.manageContainer);
            flat = applyGlobalRadio(
              flat,
              overlays,
              manageCfg.manageContainer,
              withName,
            );

            const setScoped = (fi: PanelEntry[], p: SP_COIN_DISPLAY) =>
              setScopedRadio(
                fi,
                p,
                manageCfg,
                isManageRadioChild,
                withName,
                true,
              );

            const next = ensureManageContainerAndDefaultChild(
              flat,
              manageCfg,
              withName,
              setScoped,
            );

            diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
            return writeFlatTree(prev, next);
          }

          // Opening any other GLOBAL overlay: apply global radio; close manage branch
          if (openingGlobal) {
            let next = applyGlobalRadio(flat, overlays, panel, withName);
            if (Number(panel) !== Number(manageCfg.manageContainer)) {
              manageScopedHistoryRef.current = [];
              next = closeManageBranch(
                next,
                manageCfg,
                isManageAnyChild,
                withName,
              );
            }

            diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
            return writeFlatTree(prev, next);
          }

          // Non-overlay: simple open
          const nextFlat = flat.map((e) =>
            e.panel === panel ? { ...withName(e), visible: true } : e,
          );

          diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(nextFlat));
          return writeFlatTree(prev, nextFlat);
        });
      });
    },
    [
      setExchangeContext,
      overlays,
      manageCfg,
      isGlobalOverlay,
      isManageRadioChild,
      isManageAnyChild,
      withName,
      getActiveManageScoped,
      pushManageScopedHistory,
    ],
  );

  const closePanel = useCallback(
    (
      panel: SP_COIN_DISPLAY,
      invoker?: string,
      // Back-compat only: ignored. Empty radio is always allowed.
      _unused?: unknown,
    ) => {
      logAction('closePanel', panel, invoker);
      if (!KNOWN.has(Number(panel))) return;

      // Stack maintenance
      popTopIfMatches(panel);
      removeNav(panel);

      schedule(() => {
        setExchangeContext((prev) => {
          const flat0 = flattenPanelTree(
            (prev as any)?.settings?.spCoinPanelTree,
            KNOWN,
          );

          const closingManageContainer =
            Number(panel) === Number(manageCfg.manageContainer);
          const closingGlobal = isGlobalOverlay(panel);
          const closingSponsorDetail =
            Number(panel) === Number(manageCfg.manageSponsorPanel);
          const closingManageRadioChild = isManageRadioChild(panel);

          const isRadioSurfaceClose =
            closingGlobal ||
            closingManageContainer ||
            closingManageRadioChild ||
            closingSponsorDetail;

          let next: PanelEntry[] = flat0;

          if (closingManageContainer) {
            manageScopedHistoryRef.current = [];
            next = closeManageBranch(
              flat0.map((e) =>
                e.panel === manageCfg.manageContainer
                  ? { ...withName(e), visible: false }
                  : e,
              ),
              manageCfg,
              isManageAnyChild,
              withName,
            );
          } else if (closingSponsorDetail) {
            next = flat0.map((e) =>
              e.panel === manageCfg.manageSponsorPanel
                ? { ...withName(e), visible: false }
                : e,
            );
          } else if (closingManageRadioChild) {
            next = flat0
              .map((e) =>
                e.panel === panel ? { ...withName(e), visible: false } : e,
              )
              .map((e) =>
                e.panel === manageCfg.manageSponsorPanel
                  ? { ...withName(e), visible: false }
                  : e,
              );
          } else if (closingGlobal) {
            const closingIsManage =
              Number(panel) === Number(manageCfg.manageContainer);

            next = flat0.map((e) =>
              e.panel === panel ? { ...withName(e), visible: false } : e,
            );

            // global radio becomes empty
            next = clearGlobalRadio(next, overlays, withName);

            if (closingIsManage) {
              manageScopedHistoryRef.current = [];
              next = closeManageBranch(
                next,
                manageCfg,
                isManageAnyChild,
                withName,
              );
            }
          } else {
            // Non-radio leaf close: do NOT auto-restore anything.
            next = flat0.map((e) =>
              e.panel === panel ? { ...withName(e), visible: false } : e,
            );
          }

          // ✅ FIX: only restore from stack when closing a radio surface.
          if (isRadioSurfaceClose) {
            const restore = pickRestoreTargetAfterClose(panel);
            if (restore) {
              next = activatePanel(next, restore);
            }
          }

          if (DEBUG_STACK) {
            dumpNavStack({
              tag: `closePanel(${nameOf(panel)}) radio=${isRadioSurfaceClose} ${invoker ?? ''}`.trim(),
              map: toVisibilityMap(next),
              overlays,
              known: KNOWN,
            });
          }

          diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
          return writeFlatTree(prev, next);
        });
      });
    },
    [
      setExchangeContext,
      overlays,
      manageCfg,
      isGlobalOverlay,
      isManageRadioChild,
      isManageAnyChild,
      withName,
      activatePanel,
      pickRestoreTargetAfterClose,
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

  const dumpStack = useCallback(
    (tag?: string) => dumpNavStack({ tag, map, overlays, known: KNOWN }),
    [map, overlays],
  );

  return {
    activeMainOverlay,
    isVisible,
    isTokenScrollVisible,
    getPanelChildren,
    openPanel,
    closePanel,

    // Debug
    dumpNavStack: dumpStack,
  };
}
