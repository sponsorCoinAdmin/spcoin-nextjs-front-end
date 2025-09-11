// File: lib/structure/exchangeContext/types/PanelNode.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * Generic panel-tree node type for ExchangeContext.
 * - panel: enum identifier (canonical SP_COIN_DISPLAY)
 * - visible: whether the panel is currently shown
 * - children: nested sub-panels
 * - meta: optional per-node data (ids, tags, anything)
 */
export interface PanelNode<M extends Record<string, unknown> = Record<string, unknown>> {
  panel: SP_COIN_DISPLAY;
  name: string;
  visible: boolean;
  children: PanelNode<M>[];
  meta?: M;
}

/** Alias for the tree root (main) node type. */
export type MainPanelNode<M extends Record<string, unknown> = Record<string, unknown>> = PanelNode<M>;
