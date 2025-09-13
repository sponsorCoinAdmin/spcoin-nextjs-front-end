// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts

import { SP_COIN_DISPLAY } from '@/lib/structure/enums/spCoinDisplay';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';
import type {
  MainPanelNode,   // legacy alias (single node)
  MainPanels,      // id-indexed flat list (index === enum id)
  PanelNode,
} from '@/lib/structure/exchangeContext/types/PanelNode';

const n = (panel: SP_COIN_DISPLAY, visible: boolean, children: PanelNode[] = []): PanelNode => ({
  panel,
  name: SP_COIN_DISPLAY[panel] ?? String(panel),
  visible,
  children,
});

/**
 * Source of truth for panels persisted in mainPanelNode.
 * - MAIN_OVERLAY_GROUP covers the radio overlays (Trading, Buy, Sell, Recipient, Agent, Error).
 * - We also include SPONSOR_RATE_CONFIG_PANEL so the range 0..6 is dense (no null at 5).
 */
const ALL_PANELS: SP_COIN_DISPLAY[] = Array.from(
  new Set<SP_COIN_DISPLAY>([
    ...MAIN_OVERLAY_GROUP,
    SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL, // non-overlay, but part of mainPanelNode
  ])
).sort((a, b) => a - b);

/**
 * Build an **id-indexed** array so defaultMainPanels[id].panel === id.
 * TRADING_STATION_PANEL is visible by default; others are hidden.
 */
function buildIdIndexedPanels(): MainPanels {
  const maxId = Math.max(...ALL_PANELS);
  const arr: PanelNode[] = new Array(maxId + 1);

  for (const id of ALL_PANELS) {
    const isTrading = id === SP_COIN_DISPLAY.TRADING_STATION_PANEL;
    arr[id] = n(id, isTrading, []);
  }

  return arr as MainPanels;
}

export const defaultMainPanels: MainPanels = buildIdIndexedPanels();


export const defaultMainPanelNode: MainPanelNode = n(
  SP_COIN_DISPLAY.TRADING_STATION_PANEL,
  true,
  [
    n(SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL,    false),
    n(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL,   false),
    n(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,     false),
    n(SP_COIN_DISPLAY.AGENT_SELECT_PANEL,         false),
    n(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,        false),
    n(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL,  false),
  ]
);

/** @deprecated No longer used; panel state is stored under exchangeContext.settings.mainPanelNode */
export const MAIN_PANEL_NODE_STORAGE_KEY = 'mainPanelNode';
