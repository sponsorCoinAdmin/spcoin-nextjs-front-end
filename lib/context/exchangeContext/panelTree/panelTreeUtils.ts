// File: @/lib/context/exchangeContext/panelTree/panelTreeUtils.ts
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { panelStore } from '@/lib/context/exchangeContext/panelStore';

/**
 * Shared utilities for panelTree.
 *
 * Goal: keep usePanelTree.ts thin by centralizing small helpers.
 */

/**
 * Publish visibility changes into panelStore.
 * Only emits updates for ids that changed.
 */
export function diffAndPublish(
  prevMap: Record<number, boolean>,
  nextMap: Record<number, boolean>,
) {
  const ids = new Set<number>([
    ...Object.keys(prevMap),
    ...Object.keys(nextMap),
  ].map(Number));

  ids.forEach((idNum) => {
    const id = idNum as SP_COIN_DISPLAY;
    const prev = !!prevMap[idNum];
    const next = !!nextMap[idNum];
    if (prev !== next) panelStore.setVisible(id, next);
  });
}

/** Basic guard used by open/close to ignore unknown panels. */
export function isKnownPanel(known: Set<number>, panel: SP_COIN_DISPLAY): boolean {
  return known.has(Number(panel));
}

/**
 * Optional debug dump hook helper.
 * You can pass a dump function (e.g. dumpNavStack) and this will no-op if absent.
 */
export function maybeDump(
  dumpFn: ((tag?: string) => void) | undefined,
  tag: string,
): void {
  try {
    if (typeof dumpFn === 'function') dumpFn(tag);
  } catch {
    // ignore
  }
}
