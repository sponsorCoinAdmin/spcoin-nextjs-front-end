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

const KNOWN = new Set<number>(PANEL_DEFS.map((d) => d.id));

type ClosePanelOptions = {
  /** Tree-only: allow radio group to become empty */
  allowEmptyRadio?: boolean;
};

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

  // sponsor parent tracking
  const sponsorParentRef = useRef<SP_COIN_DISPLAY | null>(null);

  // manage scoped "radio stack" tracking (so close reveals previous selection)
  // NOTE: this is GUI/UX state, not persisted; it mirrors how MAIN_OVERLAY_GROUP
  // behaves: selecting a new radio member replaces the current one, but closing
  // should reveal the previous selection.
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
      // Avoid dupes on consecutive opens.
      const stack = manageScopedHistoryRef.current;
      if (stack.length && Number(stack[stack.length - 1]) === Number(prevScoped)) {
        return;
      }
      stack.push(prevScoped);
    },
    [],
  );

  const popManageScopedHistory = useCallback(
    (disallow?: SP_COIN_DISPLAY | null) => {
      const stack = manageScopedHistoryRef.current;
      while (stack.length) {
        const cand = stack.pop() as SP_COIN_DISPLAY;
        if (disallow && Number(cand) === Number(disallow)) continue;
        // Only restore something that is still a valid scoped member.
        if (manageScopedSet.has(Number(cand))) return cand;
      }
      return null;
    },
    [manageScopedSet],
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
          // Leaving manage overlay: close branch + clear scoped history.
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

          // Remember last allowed parent whenever user opens those allowed parents.
          if (
            openingManageRadioChild &&
            manageCfg.sponsorAllowedParents.has(Number(panel))
          ) {
            sponsorParentRef.current = panel;
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

            // Push previous scoped selection before switching.
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
            // Push previous scoped selection before switching.
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

            let next = ensureManageContainerAndDefaultChild(
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
              next = closeManageBranch(next, manageCfg, isManageAnyChild, withName);
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
    (panel: SP_COIN_DISPLAY, invoker?: string, opts?: ClosePanelOptions) => {
      const allowEmptyRadio = !!opts?.allowEmptyRadio;
      logAction('closePanel', panel, invoker, { allowEmptyRadio });
      if (!KNOWN.has(Number(panel))) return;

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

          if (closingManageContainer) {
            // Always close the container + its branch. No auto-open of any other overlay.
            manageScopedHistoryRef.current = [];
            const next = closeManageBranch(
              flat0.map((e) =>
                e.panel === manageCfg.manageContainer
                  ? { ...withName(e), visible: false }
                  : e,
              ),
              manageCfg,
              isManageAnyChild,
              withName,
            );

            diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
            return writeFlatTree(prev, next);
          }

          if (closingSponsorDetail) {
            const targetAfterClose =
              sponsorParentRef.current ?? manageCfg.defaultManageChild;
            const containerIsVisible =
              !!toVisibilityMap(flat0)[Number(manageCfg.manageContainer)];

            let next = flat0.map((e) =>
              e.panel === manageCfg.manageSponsorPanel
                ? { ...withName(e), visible: false }
                : e,
            );

            // If manage container is visible, restore scoped radio to its parent.
            if (containerIsVisible) {
              next = applyGlobalRadio(
                next,
                overlays,
                manageCfg.manageContainer,
                withName,
              );
              next = setScopedRadio(
                next,
                targetAfterClose,
                manageCfg,
                isManageRadioChild,
                withName,
                true,
              );
            }

            diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
            return writeFlatTree(prev, next);
          }

          if (closingManageRadioChild) {
            const containerIsVisible =
              !!toVisibilityMap(flat0)[Number(manageCfg.manageContainer)];

            let next = flat0.map((e) =>
              e.panel === panel ? { ...withName(e), visible: false } : e,
            );

            // Always hide sponsor detail when leaving any manage child.
            next = next.map((e) =>
              e.panel === manageCfg.manageSponsorPanel
                ? { ...withName(e), visible: false }
                : e,
            );

            // If container is visible and we are closing a scoped radio child,
            // restore the previous scoped selection (stack-like). If none exists,
            // fall back to the default hub.
            if (containerIsVisible && !allowEmptyRadio) {
              const restore =
                popManageScopedHistory(panel) ?? manageCfg.defaultManageChild;

              next = applyGlobalRadio(
                next,
                overlays,
                manageCfg.manageContainer,
                withName,
              );
              next = setScopedRadio(
                next,
                restore,
                manageCfg,
                isManageRadioChild,
                withName,
                true,
              );
            }

            diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
            return writeFlatTree(prev, next);
          }

          if (closingGlobal) {
            const closingIsManage =
              Number(panel) === Number(manageCfg.manageContainer);

            let next = flat0.map((e) =>
              e.panel === panel ? { ...withName(e), visible: false } : e,
            );

            if (allowEmptyRadio) {
              next = clearGlobalRadio(next, overlays, withName);
            }

            if (closingIsManage) {
              manageScopedHistoryRef.current = [];
              next = closeManageBranch(next, manageCfg, isManageAnyChild, withName);
            }

            diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
            return writeFlatTree(prev, next);
          }

          // Non-overlay: simple close
          const nextFlat = flat0.map((e) =>
            e.panel === panel ? { ...withName(e), visible: false } : e,
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
      popManageScopedHistory,
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
