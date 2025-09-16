// File: lib/structure/exchangeContext/types/PanelNode.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * Generic panel node (can still have children for nested UIs).
 * NOTE: For the persisted main panel list (settings.mainPanelNode), we keep a FLAT array.
 *       The `children` field is deprecated for persistence and should not be written.
 *
 * - panel: enum identifier (canonical SP_COIN_DISPLAY)
 * - name: human-readable label (e.g. "TRADING_STATION_PANEL")
 * - visible: whether the panel is currently shown
 * - children: (legacy/ephemeral) nested sub-panels; DO NOT persist under mainPanelNode
 * - meta: optional per-node data (ids, tags, anything)
 */
export interface PanelNode<M extends Record<string, unknown> = Record<string, unknown>> {
  panel: SP_COIN_DISPLAY;
  name: string;
  visible: boolean;
  children?: PanelNode<M>[];

  meta?: M;
}

/** Flat list of top-level main panels (siblings). */
export type MainPanels<M extends Record<string, unknown> = Record<string, unknown>> = PanelNode<M>[];

/**
 * LEGACY: single "root" node alias kept for compatibility during migration/normalization.
 * Not used for persistence anymore; only for reading older shapes.
 */
export type MainPanelNode<M extends Record<string, unknown> = Record<string, unknown>> = PanelNode<M>;
