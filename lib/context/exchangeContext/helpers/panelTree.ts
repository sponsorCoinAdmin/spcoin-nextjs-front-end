// File: @/lib/context/exchangeContext/helpers/panelTree.ts

import type { SP_COIN_DISPLAY } from '@/lib/structure';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure'; // ✅ add this
import type { PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

/** Pre-order flatten */
export function flattenPanels<M extends Record<string, unknown> = Record<string, unknown>>(
  root: PanelNode<M>,
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
  panel: SP_COIN_DISPLAY,
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
  force?: boolean,
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

/** Close all in `group` then open `panel` (skips ids not present in tree) */
export function openOnly<M extends Record<string, unknown> = Record<string, unknown>>(
  root: PanelNode<M>,
  panel: SP_COIN_DISPLAY,
  group?: readonly SP_COIN_DISPLAY[],
): PanelNode<M> {
  // Build a fast membership set so we don't waste work toggling panels that
  // aren't even in the current tree (helps when registry/tree changes).
  const present = new Set<SP_COIN_DISPLAY>(flattenPanels(root).map((n) => n.panel));

  let next = root;

  if (group?.length) {
    for (const g of group) {
      if (!present.has(g)) continue;
      next = toggleVisibility(next, g, false);
    }
  }

  if (present.has(panel)) {
    next = toggleVisibility(next, panel, true);
  }

  return next;
}

/* ──────────────────────────────────────────────────────────────────────────────
 * GUI-only view transform
 *
 * Persisted structure stays:
 *   MAIN_TRADING_PANEL -> TRADE_CONTAINER_HEADER -> overlays...
 *
 * But the debug/tree GUI can *display* it as:
 *   MAIN_TRADING_PANEL
 *     TRADE_CONTAINER_HEADER
 *     TRADING_STATION_PANEL
 *     ...
 *
 * This does NOT affect storage/persistence; it only reshapes for rendering.
 * ────────────────────────────────────────────────────────────────────────────── */

export function hoistTradeHeaderChildrenForGui<
  M extends Record<string, unknown> = Record<string, unknown>,
>(root: PanelNode<M>): PanelNode<M> {
  // Only meaningful if root is MAIN_TRADING_PANEL (otherwise no-op)
  if (Number(root.panel) !== Number(SP.MAIN_TRADING_PANEL)) return root;

  const rootKids = root.children ?? [];
  const headerIdx = rootKids.findIndex((c) => Number(c.panel) === Number(SP.TRADE_CONTAINER_HEADER));
  if (headerIdx < 0) return root;

  const header = rootKids[headerIdx];
  const headerKids = header.children ?? [];
  if (!headerKids.length) return root;

  // We want: root.children = [ ...everything except header..., header(without children), ...headerKids ]
  // but keep header located where it already is (at headerIdx).
  // Also avoid duplicates if something already exists at root level.
  const existingRootIds = new Set<number>(rootKids.map((k) => Number(k.panel)));

  const hoisted = headerKids.filter((k) => !existingRootIds.has(Number(k.panel)));

  const headerLeaf: PanelNode<M> = {
    ...header,
    children: [], // ✅ GUI leaf (so overlays appear as siblings)
  };

  const nextKids = rootKids.slice();
  nextKids[headerIdx] = headerLeaf;

  // Insert hoisted children *immediately after* header for the exact layout you showed
  nextKids.splice(headerIdx + 1, 0, ...hoisted);

  return {
    ...root,
    children: nextKids,
  };
}
