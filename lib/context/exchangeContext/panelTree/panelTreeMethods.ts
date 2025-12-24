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

export type PanelTreeMethodsDeps = {
  overlays: SP_COIN_DISPLAY[];
  manageCfg: ManageScopeConfig;
  manageScopedSet: Set<number>;

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

  // sponsor detail restore fallback (still useful for multi-parent sponsor detail)
  sponsorParentRef: React.MutableRefObject<SP_COIN_DISPLAY | null>;
};

/**
 * Factory: creates the `activatePanel(flat, target)` method.
 *
 * Stage 2 NOTE:
 * - No stack-driven “restore last overlay / last scoped child”.
 * - Activation is deterministic and tree-based:
 *   - If target is a global overlay: make it the active overlay (radio).
 *   - If target is a manage scoped child: make manage overlay active + set scoped radio to target.
 *   - If target is sponsor detail: make manage overlay active + set scoped parent (explicit ref or default).
 *   - Otherwise: walk parents and ensure required parents are visible.
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

    // 1) Global overlay target (top-level radio)
    if (targetIsGlobal) {
      return applyGlobalRadio(flat, overlays, target, withName);
    }

    // 2) Manage container target
    if (targetIsManageContainer) {
      flat = ensurePanelPresent(flat, manageCfg.manageContainer);
      flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);

      const setScoped = (fi: PanelEntry[], p: SP_COIN_DISPLAY) =>
        setScopedRadio(fi, p, manageCfg, isManageRadioChild, withName, true);

      // Ensures container visible + default child if none visible.
      flat = ensureManageContainerAndDefaultChild(flat, manageCfg, withName, setScoped);

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

    // 4) Sponsor detail target (manage detail)
    if (targetIsSponsorDetail) {
      flat = ensurePanelPresent(flat, manageCfg.manageContainer);
      flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);

      const parentScoped =
        sponsorParentRef.current ?? manageCfg.defaultManageChild;

      flat = setScopedRadio(
        flat,
        parentScoped,
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

    // Activate parents from root-most → down to direct parent.
    for (let i = chain.length - 1; i >= 0; i--) {
      const p = chain[i] as SP_COIN_DISPLAY;

      // If a parent is a global overlay, activate that overlay (radio).
      if (isGlobalOverlay(p)) {
        flat = ensurePanelPresent(flat, p);
        flat = applyGlobalRadio(flat, overlays, p, withName);
        continue;
      }

      // If parent is manage container, activate manage overlay (radio).
      if (Number(p) === Number(manageCfg.manageContainer)) {
        flat = ensurePanelPresent(flat, manageCfg.manageContainer);
        flat = applyGlobalRadio(flat, overlays, manageCfg.manageContainer, withName);
        continue;
      }

      // If parent is a manage scoped (radio) child, activate it deterministically.
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

      // Otherwise: just ensure parent panel is visible.
      flat = ensurePanelPresent(flat, p);
      flat = flat.map((e) =>
        e.panel === p ? { ...withName(e), visible: true } : e,
      );
    }

    // Finally, ensure target visible.
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
export function summarizeVis(
  map: Record<number, boolean>,
  ids: SP_COIN_DISPLAY[],
) {
  return ids.map((id) => ({
    id: Number(id),
    name: nameOf(id),
    v: !!map[Number(id)],
  }));
}
