// File: @/lib/context/exchangeContext/panelTree/panelTreeManageScope.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { PanelEntry } from './panelTreePersistence';
import { ensurePanelPresent, toVisibilityMap } from './panelTreePersistence';

export type ManageScopeConfig = {
  known: Set<number>;
  children: Record<number, SP_COIN_DISPLAY[] | undefined>;
  manageContainer: SP_COIN_DISPLAY;
  manageScoped: SP_COIN_DISPLAY[];
  defaultManageChild: SP_COIN_DISPLAY;
  manageSponsorPanel: SP_COIN_DISPLAY;
  sponsorAllowedParents: Set<number>;
};

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

  out.delete(Number(cfg.manageContainer));
  return out;
}

export function makeManagePredicates(
  cfg: ManageScopeConfig,
  manageScopedSet: Set<number>,
  manageDescendantsSet: Set<number>,
) {
  const isManageRadioChild = (p: SP_COIN_DISPLAY) =>
    manageScopedSet.has(Number(p)) && Number(p) !== Number(cfg.manageSponsorPanel);

  const isManageAnyChild = (p: SP_COIN_DISPLAY) => manageDescendantsSet.has(Number(p));

  return { isManageRadioChild, isManageAnyChild };
}

export function closeManageBranch(
  arr: PanelEntry[],
  cfg: ManageScopeConfig,
  isManageAnyChild: (p: SP_COIN_DISPLAY) => boolean,
  withName: (e: PanelEntry) => PanelEntry,
) {
  return arr.map((e) => {
    if (e.panel === cfg.manageContainer) return { ...withName(e), visible: false };
    if (isManageAnyChild(e.panel)) return { ...withName(e), visible: false };
    return e;
  });
}

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

  // If we already have a remembered allowed parent, keep it.
  const remembered = sponsorParentRef.current;
  if (
    typeof remembered === 'number' &&
    cfg.sponsorAllowedParents.has(Number(remembered))
  ) {
    return remembered;
  }

  // Fallback: infer from currently-visible allowed parent.
  const m0 = toVisibilityMap(flat0);
  for (const idNum of cfg.sponsorAllowedParents) {
    if (m0[idNum]) return idNum as SP_COIN_DISPLAY;
  }

  return cfg.defaultManageChild;
}

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
