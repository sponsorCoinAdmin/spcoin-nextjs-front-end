// File: @/lib/context/exchangeContext/helpers/panelTree.ts

import type { SP_COIN_DISPLAY } from '@/lib/structure';
import type { PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

/** Pre-order flatten */
export function flattenPanels<M extends Record<string, unknown> = Record<string, unknown>>(
  root: PanelNode<M>
): PanelNode<M>[] {
  const out: PanelNode<M>[] = [];
  const walk = (n: PanelNode<M>) => {
    out.push(n);
    for (const child of n.children ?? []) walk(child);
  };
  walk(root);
  return out;
}

/** BFS find by panel enum */
export function findNode<M extends Record<string, unknown> = Record<string, unknown>>(
  root: PanelNode<M>,
  panel: SP_COIN_DISPLAY
): PanelNode<M> | undefined {
  const q: PanelNode<M>[] = [root];
  while (q.length) {
    const n = q.shift()!;
    if (n.panel === panel) return n;
    for (const child of n.children ?? []) q.push(child);
  }
  return undefined;
}

/** Immutable toggle; if `force` is provided, sets to that value instead of flipping */
export function toggleVisibility<M extends Record<string, unknown> = Record<string, unknown>>(
  root: PanelNode<M>,
  panel: SP_COIN_DISPLAY,
  force?: boolean
): PanelNode<M> {
  const recur = (n: PanelNode<M>): PanelNode<M> => {
    const hit = n.panel === panel;
    const visible =
      force !== undefined ? (hit ? force : n.visible) : (hit ? !n.visible : n.visible);
    return {
      ...n,
      visible,
      children: (n.children ?? []).map(recur),
    };
  };
  return recur(root);
}

/** Close all in `group` then open `panel` */
export function openOnly<M extends Record<string, unknown> = Record<string, unknown>>(
  root: PanelNode<M>,
  panel: SP_COIN_DISPLAY,
  group?: readonly SP_COIN_DISPLAY[]
): PanelNode<M> {
  let next = root;
  if (group?.length) {
    for (const g of group) next = toggleVisibility(next, g, false);
  }
  next = toggleVisibility(next, panel, true);
  return next;
}
