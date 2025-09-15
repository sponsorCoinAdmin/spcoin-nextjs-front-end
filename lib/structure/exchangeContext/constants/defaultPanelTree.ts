// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts

import { SP_COIN_DISPLAY } from '@/lib/structure/enums/spCoinDisplay';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';
import type {
  MainPanels,      // id-indexed flat list (index === enum id)
  PanelNode,
  MainPanelNode,   // single root node with shallow children
} from '@/lib/structure/exchangeContext/types/PanelNode';

/**
 * Generic node factory.
 * Use `children` only when constructing the tree default (defaultMainPanelNode).
 * Flat defaults (defaultMainPanels) keep children empty by design.
 */
const n = (panel: SP_COIN_DISPLAY, visible: boolean, children: PanelNode[] = []): PanelNode => ({
  panel,
  name: SP_COIN_DISPLAY[panel] ?? String(panel),
  visible,
  children,
});

/**
 * Source of truth for the MAIN overlays that belong in the persisted state.
 * (Trading, Buy, Sell, Recipient, Agent, Error)
 */
const ALL_PANELS: SP_COIN_DISPLAY[] = Array.from(
  new Set<SP_COIN_DISPLAY>([...MAIN_OVERLAY_GROUP])
).sort((a, b) => a - b);

/**
 * Build an **id-indexed** array so defaultMainPanels[id].panel === id.
 * TRADING_STATION_PANEL is visible by default; others are hidden.
 * Children are NOT seeded in the flat model.
 */
function buildIdIndexedPanels(): MainPanels {
  const maxId = Math.max(...ALL_PANELS);
  const arr: PanelNode[] = new Array(maxId + 1);

  for (const id of ALL_PANELS) {
    const isTrading = id === SP_COIN_DISPLAY.TRADING_STATION_PANEL;
    arr[id] = n(id, isTrading, []); // children empty in flat model
  }

  return arr as MainPanels;
}

export const defaultMainPanels: MainPanels = buildIdIndexedPanels();

/**
 * Tree default for settings.mainPanelNode (single root with shallow children).
 * - Root: TRADING_STATION_PANEL (visible)
 * - Children: other overlays (hidden)
 * This satisfies code paths that expect a MainPanelNode (not an array).
 */
export const defaultMainPanelNode: MainPanelNode = n(
  SP_COIN_DISPLAY.TRADING_STATION_PANEL,
  true,
  [
    n(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL,      false),
    n(SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL,       false),
    n(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_PANEL, false),
    n(SP_COIN_DISPLAY.AGENT_SELECT_CONFIG_PANEL,     false),
    n(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,           false),
  ]
);
