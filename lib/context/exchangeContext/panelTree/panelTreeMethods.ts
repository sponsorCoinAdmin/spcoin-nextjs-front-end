// File: @/lib/context/exchangeContext/panelTree/panelTreeMethods.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

import {
  type PanelEntry,
  ensurePanelPresent,
  toVisibilityMap,
} from '@/lib/context/exchangeContext/panelTree/panelTreePersistence';

import { applyGlobalRadio } from '@/lib/context/exchangeContext/panelTree/panelTreeRadioController';

import {
  setScopedRadio,
  ensureManageContainerAndDefaultChild,
  type ManageScopeConfig,
} from '@/lib/context/exchangeContext/panelTree/panelTreeManageScope';

export type PanelTreeMethodsDeps = {
  overlays: SP_COIN_DISPLAY[];
  manageCfg: ManageScopeConfig;

  // Predicates
  isGlobalOverlay: (p: SP_COIN_DISPLAY) => boolean;
  isManageRadioChild: (p: SP_COIN_DISPLAY) => boolean;

  // Parent selection (multi-parent support)
  parentsOf: Map<number, number[]>;
  pickParentForChild: (
    child: SP_COIN_DISPLAY,
    visMap: Record<number, boolean>,
  ) => SP_COIN_DISPLAY | null;

  // Name helper
  withName: (e: PanelEntry) => PanelEntry;
};

/**
 * Factory: creates the `activatePanel(flat, target)` method.
 *
 * Stage 3:
 * - Deterministic, tree-only activation
 * - No stack interaction
 * - No "restore last" behavior
 */
export function createActivatePanel(deps: PanelTreeMethodsDeps) {
  const {
    overlays,
    manageCfg,
    isGlobalOverlay,
    isManageRadioChild,
    parentsOf,
    pickParentForChild,
    withName,
  } = deps;

  return function activatePanel(
    flat0: PanelEntry[],
    target: SP_COIN_DISPLAY,
  ): PanelEntry[] {
    let flat = ensurePanelPresent(flat0, target);

    const targetIsGlobal = isGlobalOverlay(target);
    const targetIsManageScoped = isManageRadioChild(target);
    const targetIsManageContainer =
      Number(target) === Number(manageCfg.manageContainer);

    /* 1) Global overlay */
    if (targetIsGlobal) {
      return applyGlobalRadio(flat, overlays, target, withName);
    }

    /* 2) Manage container */
    if (targetIsManageContainer) {
      flat = ensurePanelPresent(flat, manageCfg.manageContainer);
      flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);

      const setScoped = (fi: PanelEntry[], p: SP_COIN_DISPLAY) =>
        setScopedRadio(fi, p, manageCfg, isManageRadioChild, withName, true);

      return ensureManageContainerAndDefaultChild(flat, manageCfg, withName, setScoped);
    }

    /* 3) Manage scoped child */
    if (targetIsManageScoped) {
      flat = ensurePanelPresent(flat, manageCfg.manageContainer);
      flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);

      return setScopedRadio(
        flat,
        target,
        manageCfg,
        isManageRadioChild,
        withName,
        true,
      );
    }

    /* 4) Regular panels (multi-parent walk) */
    const vis0 = toVisibilityMap(flat);
    const chain: SP_COIN_DISPLAY[] = [];
    let cur: SP_COIN_DISPLAY = target;
    const seen = new Set<number>([Number(cur)]);

    while (parentsOf.has(Number(cur))) {
      const p = pickParentForChild(cur, vis0);
      if (!p || seen.has(Number(p))) break;
      chain.push(p);
      seen.add(Number(p));
      cur = p;
    }

    for (let i = chain.length - 1; i >= 0; i--) {
      const p = chain[i];

      if (isGlobalOverlay(p)) {
        flat = ensurePanelPresent(flat, p);
        flat = applyGlobalRadio(flat, overlays, p, withName);
        continue;
      }

      if (Number(p) === Number(manageCfg.manageContainer)) {
        flat = ensurePanelPresent(flat, manageCfg.manageContainer);
        flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);
        continue;
      }

      if (isManageRadioChild(p)) {
        flat = ensurePanelPresent(flat, manageCfg.manageContainer);
        flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);
        flat = setScopedRadio(
          flat,
          p,
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
  };
}

/* ---------- helpers ---------- */

export const nameOf = (id: SP_COIN_DISPLAY) =>
  (SP_COIN_DISPLAY as any)?.[id] ?? String(id);

export function summarizeVis(map: Record<number, boolean>, ids: SP_COIN_DISPLAY[]) {
  return ids.map((id) => ({
    id: Number(id),
    name: nameOf(id),
    v: !!map[Number(id)],
  }));
}
