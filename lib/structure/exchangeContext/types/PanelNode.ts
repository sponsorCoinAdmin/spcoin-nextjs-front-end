// File: lib/structure/exchangeContext/types/PanelNode.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * Generic panel node (can still have children for nested UIs).
 * - panel: enum identifier (canonical SP_COIN_DISPLAY)
 * - name: human-readable label (e.g. "TRADING_STATION_PANEL")
 * - visible: whether the panel is currently shown
 * - children: nested sub-panels (optional)
 * - meta: optional per-node data (ids, tags, anything)
 */
export interface PanelNode<M extends Record<string, unknown> = Record<string, unknown>> {
  panel: SP_COIN_DISPLAY;
  name: string;
  visible: boolean;
  children: PanelNode<M>[];
  meta?: M;
}

/** NEW: flat list of top-level main panels (siblings). */
export type MainPanels<M extends Record<string, unknown> = Record<string, unknown>> = PanelNode<M>[];

/** LEGACY: single "root" node alias kept for compatibility during the migration. */
export type MainPanelNode<M extends Record<string, unknown> = Record<string, unknown>> = PanelNode<M>;
