// File: @/lib/context/exchangeContext/panelTree/panelNavStack.ts
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';

// One shared stack for the entire app runtime (per browser tab / JS bundle).
// Stage 3: stack is EPHEMERAL and UI-only (Header X / Back behavior).
const NAV_STACK: SP_COIN_DISPLAY[] = [];

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

/* ------------------------------- core -------------------------------- */

export function pushNav(panel: SP_COIN_DISPLAY) {
  const top = NAV_STACK.length ? NAV_STACK[NAV_STACK.length - 1] : null;

  if (top !== null && Number(top) === Number(panel)) {
    logStack('pushNav(skip-same-top)', { panel: nameOf(panel) });
    return;
  }

  NAV_STACK.push(panel);
  logStack('pushNav', { panel: nameOf(panel) });
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

export function removeNav(panel: SP_COIN_DISPLAY) {
  let removed = 0;

  for (let i = NAV_STACK.length - 1; i >= 0; i--) {
    if (Number(NAV_STACK[i]) === Number(panel)) {
      NAV_STACK.splice(i, 1);
      removed++;
    }
  }

  if (removed) {
    logStack('removeNav', { panel: nameOf(panel), removed });
  } else {
    logStack('removeNav(no-op)', { panel: nameOf(panel) });
  }
}

export function getNavTop(): SP_COIN_DISPLAY | null {
  return NAV_STACK.length
    ? (NAV_STACK[NAV_STACK.length - 1] as SP_COIN_DISPLAY)
    : null;
}

/* ------------------------------- helpers ------------------------------- */

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

/* ------------------------------- debug -------------------------------- */

/**
 * Stage 3: dump function remains, but callers that need richer dumps
 * should use panelNavStackDebug.dumpNavStack and pass stack explicitly.
 */
export function dumpNavStack(opts: { tag?: string }) {
  const { tag = 'panelNavStack.dump' } = opts;

  // eslint-disable-next-line no-console
  console.log(`[panelTree] ${tag}`, {
    stack: snapshotNamed(),
    stackTop: getNavTop()
      ? { id: Number(getNavTop()), name: nameOf(getNavTop() as SP_COIN_DISPLAY) }
      : null,
  });
}

// Optional: lets you reset between hot reloads/tests
export function __unsafeResetNavStackForTests() {
  NAV_STACK.length = 0;
  logStack('__unsafeResetNavStackForTests');
}

/* --------------------------- backwards compat -------------------------- */
/**
 * Temporary aliases so you can migrate call sites gradually.
 * Remove these once all imports are updated.
 */
export const peekNav = getNavTop;
