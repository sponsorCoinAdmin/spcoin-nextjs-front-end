// File: lib/context/exchangeContext/helpers/panelNames.ts
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { PanelNode, MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

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

export function ensurePanelNames<M extends Record<string, unknown> = Record<string, unknown>>(
  root: MainPanelNode<M>
): MainPanelNode<M> {
  return withPanelNames(root);
}
