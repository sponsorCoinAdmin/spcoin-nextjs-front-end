// File: lib/context/exchangeContext/helpers/panelNames.ts
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type {
  PanelNode,
  SpCoinPanelTree,
} from '@/lib/structure/exchangeContext/types/PanelNode';

export function withPanelNames<M extends Record<string, unknown> = Record<string, unknown>>(
  node: PanelNode<M>
): PanelNode<M> {
  const name = SP_COIN_DISPLAY[node.panel] ?? String(node.panel);
  return {
    ...node,
    name,
    children: (node.children ?? []).map((c) => withPanelNames(c)),
  };
}

/**
 * Ensure names for either a single node or a flat panel tree array.
 * Overloads keep call-sites nicely typed.
 */
export function ensurePanelNames<M extends Record<string, unknown> = Record<string, unknown>>(
  root: PanelNode<M>
): PanelNode<M>;
export function ensurePanelNames<M extends Record<string, unknown> = Record<string, unknown>>(
  root: SpCoinPanelTree<M>
): SpCoinPanelTree<M>;
export function ensurePanelNames<M extends Record<string, unknown> = Record<string, unknown>>(
  root: PanelNode<M> | SpCoinPanelTree<M>
): PanelNode<M> | SpCoinPanelTree<M> {
  return Array.isArray(root) ? root.map((n) => withPanelNames(n)) : withPanelNames(root);
}
