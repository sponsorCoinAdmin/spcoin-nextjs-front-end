// File: @/lib/context/exchangeContext/panelTree/panelNavStackDebug.ts
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';

let SEEDED = false;

const nameOf = (id: SP_COIN_DISPLAY) => SP_COIN_DISPLAY[id] ?? String(id);

/**
 * Debug dump helper.
 * If you want stack printed, pass it in explicitly.
 */
export function dumpNavStack(
  tag = 'panelNavStack.dump',
  opts?: {
    stack?: SP_COIN_DISPLAY[];
    map?: Record<number, boolean>;
    overlays?: SP_COIN_DISPLAY[];
    known?: Set<number>;
  },
) {
  const st = opts?.stack ?? [];

  const stack = st.map((p: SP_COIN_DISPLAY) => ({
    id: Number(p),
    name: nameOf(p),
  }));

  const stackTop = st.length
    ? {
        id: Number(st[st.length - 1]),
        name: nameOf(st[st.length - 1] as SP_COIN_DISPLAY),
      }
    : null;

  const map = opts?.map;
  const overlays = opts?.overlays ?? [];
  const known = opts?.known;

  const visibleFromMap = map
    ? Object.entries(map)
        .filter(([, v]) => !!v)
        .map(([k]) => Number(k))
        .filter((idNum) => (known ? known.has(idNum) : true))
        .map((idNum) => ({
          id: idNum,
          name: nameOf(idNum as SP_COIN_DISPLAY),
        }))
    : [];

  const activeOverlaysFromMap = map
    ? overlays
        .filter((id) => !!map[Number(id)])
        .map((id) => ({ id: Number(id), name: nameOf(id) }))
    : [];

  // eslint-disable-next-line no-console
  console.log(`[panelTree] ${tag}`, {
    stack,
    stackTop,
    activeOverlaysFromMap,
    visibleCountFromMap: visibleFromMap.length,
    visibleFromMap,
  });
}

// Optional: lets you reset between hot reloads/tests
export function __unsafeResetNavSeedForTests() {
  SEEDED = false;
}
