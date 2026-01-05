// File: @/lib/context/exchangeContext/panelTree/panelTreeManageScope.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { PanelEntry } from './panelTreePersistence';
import { ensurePanelPresent, toVisibilityMap } from './panelTreePersistence';

export type ManageScopeConfig = {
  known: Set<number>;
  children: Record<number, SP_COIN_DISPLAY[] | undefined>;

  /**
   * NEW model: there is no "manage container" overlay.
   * We keep this field for backward compat and set it to the landing overlay panel:
   *   SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL
   */
  manageContainer: SP_COIN_DISPLAY;

  /**
   * NEW model: manageScoped is empty (no nested scoped radio group).
   */
  manageScoped: SP_COIN_DISPLAY[];

  /**
   * Default manage panel (landing panel). In the new model this equals manageContainer.
   */
  defaultManageChild: SP_COIN_DISPLAY;

  manageSponsorPanel: SP_COIN_DISPLAY;
  sponsorAllowedParents: Set<number>;
};

const isPendingRewards = (p: SP_COIN_DISPLAY) =>
  Number(p) === Number(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);

export function computeManageDescendantsSet(
  cfg: Pick<ManageScopeConfig, 'known' | 'children' | 'manageContainer'>,
) {
  const out = new Set<number>();
  const stack: number[] = [Number(cfg.manageContainer)];

  while (stack.length) {
    const cur = stack.pop() as number;
    const kids = (cfg.children?.[cur] as SP_COIN_DISPLAY[] | undefined) ?? [];
    for (const k of kids) {
      const kn = Number(k);
      if (!cfg.known.has(kn)) continue;
      if (!out.has(kn)) {
        out.add(kn);
        stack.push(kn);
      }
    }
  }

  // Do not include the "container" itself in descendants.
  out.delete(Number(cfg.manageContainer));

  // ✅ Pending Rewards is local-only; it must not be considered a "manage descendant"
  // for branch-close purposes (otherwise it gets auto-hidden on leaving Manage).
  out.delete(Number(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS));

  return out;
}

export function makeManagePredicates(
  cfg: ManageScopeConfig,
  manageScopedSet: Set<number>,
  manageDescendantsSet: Set<number>,
) {
  // NEW model: manageScopedSet is empty => always false.
  const isManageRadioChild = (p: SP_COIN_DISPLAY) =>
    manageScopedSet.has(Number(p)) && Number(p) !== Number(cfg.manageSponsorPanel);

  /**
   * NEW model: usually false unless you still nest children under manageContainer in registry.
   *
   * Note:
   * - Pending Rewards is already excluded from manageDescendantsSet in computeManageDescendantsSet().
   */
  const isManageAnyChild = (p: SP_COIN_DISPLAY) => manageDescendantsSet.has(Number(p));

  return { isManageRadioChild, isManageAnyChild };
}

/**
 * NEW model:
 * There is no container branch to close; manage panels are overlays.
 *
 * Compatibility behavior:
 * - Always hides manageContainer (landing panel).
 * - Also hides any descendants IF your registry still nests children under manageContainer.
 *
 * ✅ Pending Rewards exception:
 * - Pending is a local/inline toggle and must NOT be force-hidden by branch close.
 */
export function closeManageBranch(
  arr: PanelEntry[],
  cfg: ManageScopeConfig,
  isManageAnyChild: (p: SP_COIN_DISPLAY) => boolean,
  withName: (e: PanelEntry) => PanelEntry,
) {
  return arr.map((e) => {
    if (e.panel === cfg.manageContainer) return { ...withName(e), visible: false };

    // ✅ Hard safety: never auto-hide Pending Rewards due to branch close
    if (isPendingRewards(e.panel)) return e;

    if (isManageAnyChild(e.panel)) return { ...withName(e), visible: false };
    return e;
  });
}

/**
 * OLD model: container + nested scoped radio.
 * NEW model: manageScoped is empty, so this becomes:
 * - ensure manageContainer present (optional)
 * - ensure makeVisible present
 * - (no scoped-radio toggling because there are no manageScoped members)
 *
 * NOTE: We do NOT auto-open makeVisible here unless it's the container itself.
 * Callers that use this in the NEW model should open overlays directly via openPanel().
 */
export function setScopedRadio(
  flatIn: PanelEntry[],
  makeVisible: SP_COIN_DISPLAY,
  cfg: ManageScopeConfig,
  isManageRadioChild: (p: SP_COIN_DISPLAY) => boolean,
  withName: (e: PanelEntry) => PanelEntry,
  alsoEnsureContainer = true,
) {
  let next = flatIn;
  if (alsoEnsureContainer) next = ensurePanelPresent(next, cfg.manageContainer);
  next = ensurePanelPresent(next, makeVisible);

  return next.map((e) => {
    if (e.panel === cfg.manageContainer) {
      return {
        ...withName(e),
        visible: alsoEnsureContainer ? true : e.visible,
      };
    }
    if (isManageRadioChild(e.panel)) {
      return { ...withName(e), visible: e.panel === makeVisible };
    }
    return e;
  });
}

export function pickSponsorParent(
  flat0: PanelEntry[],
  cfg: ManageScopeConfig,
  sponsorParentRef: { current: SP_COIN_DISPLAY | null },
  explicit?: SP_COIN_DISPLAY,
): SP_COIN_DISPLAY {
  const explicitOk =
    typeof explicit === 'number' && cfg.sponsorAllowedParents.has(Number(explicit));
  if (explicitOk) return explicit as SP_COIN_DISPLAY;

  const remembered = sponsorParentRef.current;
  if (
    typeof remembered === 'number' &&
    cfg.sponsorAllowedParents.has(Number(remembered))
  ) {
    return remembered;
  }

  // Infer from currently-visible allowed parent.
  const m0 = toVisibilityMap(flat0);
  for (const idNum of cfg.sponsorAllowedParents) {
    if (m0[idNum]) return idNum as SP_COIN_DISPLAY;
  }

  // Default to landing/manage panel in the new model.
  return cfg.defaultManageChild;
}

/**
 * OLD model: ensure container and default child if none visible.
 * NEW model: manageScoped is empty, so:
 * - anyChildVisible is always false
 * - we ensure defaultManageChild (landing panel) is opened (via setScopedRadioFn)
 * - sponsor detail OFF
 */
export function ensureManageContainerAndDefaultChild(
  flat: PanelEntry[],
  cfg: ManageScopeConfig,
  withName: (e: PanelEntry) => PanelEntry,
  setScopedRadioFn: (flatIn: PanelEntry[], makeVisible: SP_COIN_DISPLAY) => PanelEntry[],
) {
  const map0 = toVisibilityMap(flat);
  const anyChildVisible = cfg.manageScoped.some((id) => !!map0[Number(id)]);

  let next = flat;
  if (!anyChildVisible) {
    next = setScopedRadioFn(flat, cfg.defaultManageChild);
  } else {
    next = flat.map((e) =>
      e.panel === cfg.manageContainer ? { ...withName(e), visible: true } : e,
    );
  }

  // sponsor detail OFF
  next = next.map((e) =>
    e.panel === cfg.manageSponsorPanel ? { ...withName(e), visible: false } : e,
  );

  return next;
}
