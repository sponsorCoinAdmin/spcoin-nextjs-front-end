// File: @/lib/context/exchangeContext/panelTree/panelNavStack.ts
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';

// One shared stack for the entire app runtime (per browser tab / JS bundle).
const NAV_STACK: SP_COIN_DISPLAY[] = [];

/**
 * NOTE (Stage 2 direction):
 * The stack is now *bookkeeping only* (HeaderX redirection + debug),
 * NOT a driver of visibility restoration.
 *
 * That means the stack must never become "stale" after reload/persistence.
 * We therefore allow re-seeding when:
 *  - stack is empty, OR
 *  - stackTop is not visible anymore (map disagrees)
 */

const DEBUG_STACK =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_OVERLAY_CLOSE === 'true';

const nameOf = (id: SP_COIN_DISPLAY) => SP_COIN_DISPLAY[id] ?? String(id);

const snapshotNamed = () =>
  NAV_STACK.map((p) => ({ id: Number(p), name: nameOf(p) }));

function logStack(event: string, extra?: Record<string, unknown>) {
  if (!DEBUG_STACK) return;
  // eslint-disable-next-line no-console
  console.log(`[panelNavStack] ${event}`, {
    size: NAV_STACK.length,
    top: NAV_STACK.length
      ? {
          id: Number(NAV_STACK[NAV_STACK.length - 1]),
          name: nameOf(NAV_STACK[NAV_STACK.length - 1] as SP_COIN_DISPLAY),
        }
      : null,
    stack: snapshotNamed(),
    ...extra,
  });
}

export function pushNav(panel: SP_COIN_DISPLAY) {
  const top = NAV_STACK.length ? NAV_STACK[NAV_STACK.length - 1] : null;
  if (top !== null && Number(top) === Number(panel)) {
    logStack('pushNav(skip-same-top)', { panel: nameOf(panel) });
    return;
  }
  NAV_STACK.push(panel);
  logStack('pushNav', { panel: nameOf(panel) });
}

// Returns a copy so callers can't mutate the real stack.
export function navStackSnapshot(): SP_COIN_DISPLAY[] {
  return NAV_STACK.slice();
}

// Convenience for debug UIs.
export function navStackSnapshotNamed() {
  return snapshotNamed();
}

export function removeNav(panel: SP_COIN_DISPLAY) {
  const beforeLen = NAV_STACK.length;
  // remove ALL occurrences to avoid stale duplicates
  for (let i = NAV_STACK.length - 1; i >= 0; i--) {
    if (Number(NAV_STACK[i]) === Number(panel)) NAV_STACK.splice(i, 1);
  }
  const removed = beforeLen - NAV_STACK.length;
  if (removed) logStack('removeNav', { panel: nameOf(panel), removed });
  else logStack('removeNav(no-op)', { panel: nameOf(panel) });
}

export function popTopIfMatches(panel: SP_COIN_DISPLAY) {
  if (!NAV_STACK.length) {
    logStack('popTopIfMatches(empty)', { panel: nameOf(panel) });
    return;
  }
  const top = NAV_STACK[NAV_STACK.length - 1];
  if (Number(top) === Number(panel)) {
    NAV_STACK.pop();
    logStack('popTopIfMatches(pop)', { panel: nameOf(panel) });
  } else {
    logStack('popTopIfMatches(no-match)', {
      panel: nameOf(panel),
      top: nameOf(top as SP_COIN_DISPLAY),
    });
  }
}

export function peekNav(): SP_COIN_DISPLAY | null {
  return NAV_STACK.length
    ? (NAV_STACK[NAV_STACK.length - 1] as SP_COIN_DISPLAY)
    : null;
}

export function findLastInStack(
  set: Set<number>,
  disallow?: SP_COIN_DISPLAY | null,
): SP_COIN_DISPLAY | null {
  for (let i = NAV_STACK.length - 1; i >= 0; i--) {
    const cand = NAV_STACK[i] as SP_COIN_DISPLAY;
    if (disallow && Number(cand) === Number(disallow)) continue;
    if (set.has(Number(cand))) return cand;
  }
  return null;
}

function rebuildFromVisibility(opts: {
  map: Record<number, boolean>;
  overlays: SP_COIN_DISPLAY[];
  manageContainer: SP_COIN_DISPLAY;
  manageScoped: SP_COIN_DISPLAY[];
  manageSponsorPanel: SP_COIN_DISPLAY;
}) {
  const { map, overlays, manageContainer, manageScoped, manageSponsorPanel } =
    opts;

  const isVisibleFromMap = (id: SP_COIN_DISPLAY) => !!map[Number(id)];

  // Build a fresh seed based on current visibility
  const fresh: SP_COIN_DISPLAY[] = [];

  // 1) Active global overlay (top-level radio)
  const activeOverlay = overlays.find((id) => isVisibleFromMap(id)) ?? null;
  if (activeOverlay) fresh.push(activeOverlay);

  // 2) If Manage overlay active, seed scoped child + sponsor detail (if visible)
  if (activeOverlay && Number(activeOverlay) === Number(manageContainer)) {
    const activeScoped =
      manageScoped.find((id) => isVisibleFromMap(id)) ?? null;
    if (activeScoped) fresh.push(activeScoped);

    if (isVisibleFromMap(manageSponsorPanel)) {
      fresh.push(manageSponsorPanel);
    }
  }

  return { fresh, activeOverlay };
}

/**
 * Reconciles the stack with the current visibility.
 *
 * This is intentionally conservative:
 * - If the stack is empty, seed it.
 * - If the stackTop is no longer visible, reseed it.
 * - Otherwise do nothing (open/close already keep it updated).
 */
export function seedNavStackFromVisibility(opts: {
  map: Record<number, boolean>;
  overlays: SP_COIN_DISPLAY[];
  manageContainer: SP_COIN_DISPLAY;
  manageScoped: SP_COIN_DISPLAY[];
  manageSponsorPanel: SP_COIN_DISPLAY;
}) {
  const { map } = opts;

  const anyVisible = Object.values(map).some(Boolean);
  if (!anyVisible) return;

  const top = peekNav();
  const topVisible = top ? !!map[Number(top)] : false;

  // Seed if empty, or if top became stale (common after refresh/persistence)
  if (NAV_STACK.length && topVisible) {
    logStack('seedNavStackFromVisibility(skip-in-sync)', {
      top: top ? nameOf(top) : null,
    });
    return;
  }

  const { fresh, activeOverlay } = rebuildFromVisibility(opts);

  NAV_STACK.length = 0;
  NAV_STACK.push(...fresh);

  logStack('seedNavStackFromVisibility(reseed)', {
    activeOverlay: activeOverlay ? nameOf(activeOverlay) : null,
  });
}

export function dumpNavStack(opts: {
  tag?: string;
  map: Record<number, boolean>;
  overlays: SP_COIN_DISPLAY[];
  known?: Set<number>;
}) {
  const { tag = 'panelNavStack.dump', map, overlays, known } = opts;

  const stack = NAV_STACK.map((p) => ({ id: Number(p), name: nameOf(p) }));
  const top = NAV_STACK.length
    ? {
        id: Number(NAV_STACK[NAV_STACK.length - 1]),
        name: nameOf(NAV_STACK[NAV_STACK.length - 1] as SP_COIN_DISPLAY),
      }
    : null;

  const overlaysFromMap = overlays
    .filter((id) => !!map[Number(id)])
    .map((id) => ({ id: Number(id), name: nameOf(id) }));

  const visibleFromMap = Object.entries(map)
    .filter(([, v]) => !!v)
    .map(([k]) => Number(k))
    .filter((idNum) => (known ? known.has(idNum) : true))
    .map((idNum) => ({ id: idNum, name: nameOf(idNum as SP_COIN_DISPLAY) }));

  // eslint-disable-next-line no-console
  console.log(`[panelTree] ${tag}`, {
    stack,
    stackTop: top,
    activeOverlaysFromMap: overlaysFromMap,
    visibleCountFromMap: visibleFromMap.length,
    visibleFromMap,
  });
}

// Optional: lets you reset between hot reloads/tests
export function __unsafeResetNavStackForTests() {
  NAV_STACK.length = 0;
  logStack('__unsafeResetNavStackForTests');
}
