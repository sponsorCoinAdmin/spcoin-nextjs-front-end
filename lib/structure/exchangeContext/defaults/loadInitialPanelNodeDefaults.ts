// File: lib/structure/exchangeContext/defaults/loadInitialPanelNodeDefaults.ts
import { SP_COIN_DISPLAY as SP } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import type { PanelNode, SpCoinPanelTree } from '@/lib/structure/exchangeContext/types/PanelNode';
import { PANEL_DEFS } from '@/lib/structure/exchangeContext/registry/panelRegistry';

/**
 * Panels that should start visible on first run.
 * - MAIN_TRADING_PANEL gates the whole trading experience.
 * - TRADING_STATION_PANEL is the initial radio overlay (you can close it later to have none selected).
 */
const DEFAULT_VISIBLE = new Set<SP>([
  SP.MAIN_TRADING_PANEL,     // gate on by default
  SP.TRADING_STATION_PANEL,  // initial radio overlay visible
  SP.SELL_SELECT_PANEL,
  SP.BUY_SELECT_PANEL,
  SP.SWAP_ARROW_BUTTON,
  SP.PRICE_BUTTON,
  SP.FEE_DISCLOSURE,
]);

export function loadInitialPanelNodeDefaults(): SpCoinPanelTree {
  const nameOf = (id: SP) => (SP as any)[id] ?? String(id);

  // Seed a flat array of {panel, name, visible}. Children are derived virtually in the Test UI.
  return PANEL_DEFS.map<PanelNode>(({ id }) => ({
    panel: id,
    name: nameOf(id),
    visible: DEFAULT_VISIBLE.has(id),
  }));
}
