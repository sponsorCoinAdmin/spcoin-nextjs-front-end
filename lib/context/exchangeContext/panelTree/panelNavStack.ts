// File: @/lib/context/exchangeContext/panelTree/panelNavStack.ts
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';

// One shared stack for the entire app runtime (per browser tab / JS bundle).
const NAV_STACK: SP_COIN_DISPLAY[] = [];
let NAV_STACK_SEEDED = false;

const nameOf = (id: SP_COIN_DISPLAY) => SP_COIN_DISPLAY[id] ?? String(id);

export function pushNav(panel: SP_COIN_DISPLAY) {
  const top = NAV_STACK.length ? NAV_STACK[NAV_STACK.length - 1] : null;
  if (top !== null && Number(top) === Number(panel)) return;
  NAV_STACK.push(panel);
}

// Returns a copy so callers can't mutate the real stack.
export function navStackSnapshot(): SP_COIN_DISPLAY[] {
  return NAV_STACK.slice();
}

export function removeNav(panel: SP_COIN_DISPLAY) {
  // remove ALL occurrences to avoid stale duplicates
  for (let i = NAV_STACK.length - 1; i >= 0; i--) {
    if (Number(NAV_STACK[i]) === Number(panel)) NAV_STACK.splice(i, 1);
  }
}

export function popTopIfMatches(panel: SP_COIN_DISPLAY) {
  if (!NAV_STACK.length) return;
  const top = NAV_STACK[NAV_STACK.length - 1];
  if (Number(top) === Number(panel)) NAV_STACK.pop();
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

export function seedNavStackFromVisibility(opts: {
  map: Record<number, boolean>;
  overlays: SP_COIN_DISPLAY[];
  manageContainer: SP_COIN_DISPLAY;
  manageScoped: SP_COIN_DISPLAY[];
  manageSponsorPanel: SP_COIN_DISPLAY;
}) {
  const { map, overlays, manageContainer, manageScoped, manageSponsorPanel } =
    opts;

  if (NAV_STACK_SEEDED) return;
  const anyVisible = Object.values(map).some(Boolean);
  if (!anyVisible) return;

  NAV_STACK_SEEDED = true;

  // Don’t overwrite if something already pushed into the stack.
  if (NAV_STACK.length) return;

  const isVisibleFromMap = (id: SP_COIN_DISPLAY) => !!map[Number(id)];

  // 1) Active global overlay (top-level radio)
  const activeOverlay = overlays.find((id) => isVisibleFromMap(id)) ?? null;
  if (activeOverlay) NAV_STACK.push(activeOverlay);

  // 2) If Manage overlay is active, seed scoped child + sponsor detail (if visible)
  if (activeOverlay && Number(activeOverlay) === Number(manageContainer)) {
    const activeScoped =
      manageScoped.find((id) => isVisibleFromMap(id)) ?? null;
    if (activeScoped) NAV_STACK.push(activeScoped);

    if (isVisibleFromMap(manageSponsorPanel)) {
      NAV_STACK.push(manageSponsorPanel);
    }
  }
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
  NAV_STACK_SEEDED = false;
}
