// File: @/lib/context/exchangeContext/panelTree/branchDisplayStack.ts

import type { SP_COIN_DISPLAY } from '@/lib/structure';
import { panelName } from '@/lib/context/exchangeContext/panelTree/panelTreePersistence';

/**
 * Persisted displayStack node (current format)
 * NOTE: this matches usePanelTree.ts DISPLAY_STACK_NODE.
 */
export type DISPLAY_STACK_NODE = {
  id: SP_COIN_DISPLAY;
  name: string;
};

/**
 * Legacy node format (kept for backwards compatibility / migrations)
 */
export type LEGACY_PANEL_TYPE = {
  displayTypeId: SP_COIN_DISPLAY;
  displayTypeName: string;
};

/**
 * Build current persisted displayStack nodes: [{ id, name }]
 */
export const buildBranchDisplayStack = (
  ids: readonly SP_COIN_DISPLAY[],
): DISPLAY_STACK_NODE[] =>
  ids.map((id) => ({
    id,
    name: panelName(Number(id) as any),
  }));
