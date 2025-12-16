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
  switchToDefaultGlobal,
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

  // Default global overlay: radio index 0 (fallback to TRADING_STATION_PANEL)
  const DEFAULT_GLOBAL_OVERLAY = useMemo<SP_COIN_DISPLAY>(() => {
    const first = overlays[0];
    return typeof first === 'number'
      ? (first as SP_COIN_DISPLAY)
      : SP_COIN_DISPLAY.TRADING_STATION_PANEL;
  }, [overlays]);

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

          const doSwitchToDefaultGlobal = (flatIn: PanelEntry[]) => {
            let next = switchToDefaultGlobal(
              flatIn,
              overlays,
              DEFAULT_GLOBAL_OVERLAY,
              withName,
            );
            if (Number(DEFAULT_GLOBAL_OVERLAY) !== Number(manageCfg.manageContainer)) {
              next = closeManageBranch(next, manageCfg, isManageAnyChild, withName);
            }
            return next;
          };

          if (closingManageContainer) {
            if (!allowEmptyRadio) {
              let next = closeManageBranch(
                flat0.map((e) =>
                  e.panel === manageCfg.manageContainer
                    ? { ...withName(e), visible: false }
                    : e,
                ),
                manageCfg,
                isManageAnyChild,
                withName,
              );
              next = doSwitchToDefaultGlobal(next);
              diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
              return writeFlatTree(prev, next);
            }

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

            next = next.map((e) =>
              e.panel === manageCfg.manageSponsorPanel
                ? { ...withName(e), visible: false }
                : e,
            );

            if (containerIsVisible) {
              next = applyGlobalRadio(
                next,
                overlays,
                manageCfg.manageContainer,
                withName,
              );
              next = setScopedRadio(
                next,
                manageCfg.defaultManageChild,
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
            // Normal close of any global radio member → select default.
            if (!allowEmptyRadio) {
              const next = doSwitchToDefaultGlobal(flat0);
              diffAndPublish(toVisibilityMap(flat0), toVisibilityMap(next));
              return writeFlatTree(prev, next);
            }

            // Tree clear path: allow empty
            const closingIsManage = Number(panel) === Number(manageCfg.manageContainer);

            let next = clearGlobalRadio(flat0, overlays, withName);
            if (!closingIsManage) {
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
      DEFAULT_GLOBAL_OVERLAY,
      manageCfg,
      isGlobalOverlay,
      isManageRadioChild,
      isManageAnyChild,
      withName,
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
