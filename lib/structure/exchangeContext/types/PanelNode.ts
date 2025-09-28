// File: lib/structure/exchangeContext/types/PanelNode.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * Panel node (may still have children for ephemeral/nested UI).
 * NOTE: For the persisted main panel list (settings.mainPanelNode), we keep a FLAT array.
 *       The `children` field is deprecated for persistence and should not be written.
 */
export interface PanelNode<M extends Record<string, unknown> = Record<string, unknown>> {
  panel: SP_COIN_DISPLAY;
  visible: boolean;
  name?: string;                 // optional label (e.g., "TRADING_STATION_PANEL")
  children?: PanelNode<M>[];     // legacy/ephemeral — do not persist under mainPanelNode
  meta?: M;                      // optional per-node data
}

/**
 * The persisted main panel state is a FLAT array of PanelNode.
 * Use this type for settings.mainPanelNode everywhere.
 */
export type MainPanelNode<M extends Record<string, unknown> = Record<string, unknown>> =
  PanelNode<M>[];
