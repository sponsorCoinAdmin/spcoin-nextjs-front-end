// File: @/lib/structure/exchangeContext/types/ExchangeContextPanels.ts

import type { SpCoinPanelTree, PanelNode } from './PanelNode';

/**
 * Minimal extension you can merge into your ExchangeContext shape.
 * We keep it separate so it can be composed into your existing type.
 */
export interface ExchangeContextWithPanels {
  /**
   * PERSISTED: Flat list of panels (NO children). This is the storage shape.
   *
   * – If this is an empty array, the app should seed from authored defaults.
   * – Do NOT persist transient/overlay children here.
   */
  spCoinPanelTree: SpCoinPanelTree;

  /**
   * Optional schema version for migrations of the persisted flat list.
   * Bump when persistence/migration behavior changes.
   */
  spCoinPanelSchemaVersion?: number;

  /**
   * RUNTIME-ONLY: Expanded tree used by the UI (names + transient children).
   * Never persist this — it’s derived each boot/write from `spCoinPanelTree`.
   */
  spCoinPanelTreeRuntime?: PanelNode[];
}
