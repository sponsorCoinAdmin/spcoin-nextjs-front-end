// File: lib/structure/exchangeContext/defaults/loadInitialPanelNodeDefaults.ts

import { SP_COIN_DISPLAY as SP } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import type { PanelNode, MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { PANEL_DEFS } from '@/lib/structure/exchangeContext/registry/panelRegistry';

// Panels that should start visible on first run
const DEFAULT_VISIBLE = new Set<SP>([
  SP.TRADING_STATION_PANEL,
  SP.SELL_SELECT_PANEL,
  SP.BUY_SELECT_PANEL,
  SP.SWAP_ARROW_BUTTON,
  SP.PRICE_BUTTON,
  SP.FEE_DISCLOSURE,
]);

export function loadInitialPanelNodeDefaults(): MainPanelNode {
  const nameOf = (id: SP) => (SP as any)[id] ?? String(id);
  return PANEL_DEFS.map<PanelNode>(({ id }) => ({
    panel: id,
    name: nameOf(id),
    visible: DEFAULT_VISIBLE.has(id),
  }));
}
