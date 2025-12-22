// File: @/lib/context/exchangeContext/panelTree/panelTreeMethods.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

import {
  type PanelEntry,
  ensurePanelPresent,
  toVisibilityMap,
} from '@/lib/context/exchangeContext/panelTree/panelTreePersistence';

import { applyGlobalRadio } from '@/lib/context/exchangeContext/panelTree/panelTreeRadio';

import {
  setScopedRadio,
  ensureManageContainerAndDefaultChild,
  type ManageScopeConfig,
} from '@/lib/context/exchangeContext/panelTree/panelTreeManageScope';

import { findLastInStack } from '@/lib/context/exchangeContext/panelTree/panelNavStack';

export type PanelTreeMethodsDeps = {
  overlays: SP_COIN_DISPLAY[];
  manageCfg: ManageScopeConfig;
  manageScopedSet: Set<number>;

  // Predicates
  isGlobalOverlay: (p: SP_COIN_DISPLAY) => boolean;
  isManageRadioChild: (p: SP_COIN_DISPLAY) => boolean;

  // Parent selection (multi-parent support)
  parentsOf: Map<number, number[]>;
  pickParentForChild: (child: SP_COIN_DISPLAY, visMap: Record<number, boolean>) => SP_COIN_DISPLAY | null;

  // Name helper
  withName: (e: PanelEntry) => PanelEntry;

  // sponsor detail restore fallback
  sponsorParentRef: React.MutableRefObject<SP_COIN_DISPLAY | null>;
};

/**
 * Factory: creates the `activatePanel(flat, target)` method.
 * Keeps the big restore logic out of usePanelTree.ts.
 */
export function createActivatePanel(deps: PanelTreeMethodsDeps) {
  const {
    overlays,
    manageCfg,
    manageScopedSet,
    isGlobalOverlay,
    isManageRadioChild,
    parentsOf,
    pickParentForChild,
    withName,
    sponsorParentRef,
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
    const targetIsSponsorDetail =
      Number(target) === Number(manageCfg.manageSponsorPanel);

    // 1) Global overlay target
    if (targetIsGlobal) {
      return applyGlobalRadio(flat, overlays, target, withName);
    }

    // 2) Manage container target
    if (targetIsManageContainer) {
      flat = ensurePanelPresent(flat, manageCfg.manageContainer);
      flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);

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
      return flat.map((e) =>
        e.panel === manageCfg.manageSponsorPanel
          ? { ...withName(e), visible: false }
          : e,
      );
    }

    // 3) Manage-scoped child target
    if (targetIsManageScoped) {
      flat = ensurePanelPresent(flat, manageCfg.manageContainer);
      flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);

      flat = setScopedRadio(
        flat,
        target,
        manageCfg,
        isManageRadioChild,
        withName,
        true,
      );

      // Sponsor detail OFF
      return flat.map((e) =>
        e.panel === manageCfg.manageSponsorPanel
          ? { ...withName(e), visible: false }
          : e,
      );
    }

    // 4) Sponsor detail target
    if (targetIsSponsorDetail) {
      flat = ensurePanelPresent(flat, manageCfg.manageContainer);
      flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);

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

      return flat.map((e) =>
        e.panel === manageCfg.manageSponsorPanel
          ? { ...withName(e), visible: true }
          : e,
      );
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
          findLastInStack(new Set<number>(overlays as unknown as number[])) ?? p;
        flat = ensurePanelPresent(flat, lastOverlay);
        flat = applyGlobalRadio(flat, overlays, lastOverlay, withName);
        continue;
      }

      if (Number(p) === Number(manageCfg.manageContainer)) {
        flat = ensurePanelPresent(flat, manageCfg.manageContainer);
        flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);
        continue;
      }

      if (isManageRadioChild(p)) {
        const lastScoped = findLastInStack(manageScopedSet) ?? p;
        flat = ensurePanelPresent(flat, manageCfg.manageContainer);
        flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);
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
  };
}

// Small utility (optional but handy in split code)
export const nameOf = (id: SP_COIN_DISPLAY) =>
  (SP_COIN_DISPLAY as any)?.[id] ?? String(id);

// For quick logging in callers (keeps logs consistent)
export function summarizeVis(map: Record<number, boolean>, ids: SP_COIN_DISPLAY[]) {
  return ids.map((id) => ({ id: Number(id), name: nameOf(id), v: !!map[Number(id)] }));
}
