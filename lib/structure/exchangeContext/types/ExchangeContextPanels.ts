// File: lib/structure/exchangeContext/types/ExchangeContextPanels.ts

import type { MainPanelNode } from './PanelNode';

/**
 * Minimal extension you can merge into your ExchangeContext shape.
 * We keep it separate so it can be composed into your existing type.
 */
export interface ExchangeContextWithPanels {
  /**
   * Root of the visible panel tree for the app.
   * If null, the UI should initialize it from defaults or storage.
   */
  mainPanelNode: MainPanelNode | null;
}
