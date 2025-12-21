// File: @/lib/context/exchangeContext/panelTree/panelNavStackDebug.ts
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { navStackSnapshot } from './panelNavStack';

let SEEDED = false;

const nameOf = (id: SP_COIN_DISPLAY) => SP_COIN_DISPLAY[id] ?? String(id);

export function seedNavStackOnceFromVisibility(opts: {
  map: Record<number, boolean>;
  overlays: SP_COIN_DISPLAY[];
  manageContainer: SP_COIN_DISPLAY;
  manageScoped: SP_COIN_DISPLAY[];
  manageSponsorPanel: SP_COIN_DISPLAY;
  push: (p: SP_COIN_DISPLAY) => void;
}) {
  const {
    map,
    overlays,
    manageContainer,
    manageScoped,
    manageSponsorPanel,
    push,
  } = opts;

  if (SEEDED) return;
  if (!Object.values(map).some(Boolean)) return;

  SEEDED = true;

  // Don’t overwrite if something already pushed into the stack.
  if (navStackSnapshot().length) return;

  const isVis = (id: SP_COIN_DISPLAY) => !!map[Number(id)];

  const activeOverlay = overlays.find((id) => isVis(id)) ?? null;
  if (activeOverlay) push(activeOverlay);

  if (activeOverlay && Number(activeOverlay) === Number(manageContainer)) {
    const activeScoped = manageScoped.find((id) => isVis(id)) ?? null;
    if (activeScoped) push(activeScoped);
    if (isVis(manageSponsorPanel)) push(manageSponsorPanel);
  }

  // eslint-disable-next-line no-console
  console.log('[panelTree] seeded NAV_STACK from map', {
    stack: navStackSnapshot().map((p: SP_COIN_DISPLAY) => ({
      id: Number(p),
      name: nameOf(p),
    })),
  });
}

export function dumpNavStack(
  tag = 'panelNavStack.dump',
  opts?: {
    map?: Record<number, boolean>;
    overlays?: SP_COIN_DISPLAY[];
    known?: Set<number>;
  },
) {
  const st = navStackSnapshot();

  const stack = st.map((p: SP_COIN_DISPLAY) => ({ id: Number(p), name: nameOf(p) }));
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
