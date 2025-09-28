// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts

import type { MainPanelNode, PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { SP_COIN_DISPLAY } from '../enums/spCoinDisplay';

const n = (panel: SP_COIN_DISPLAY, visible: boolean, children?: PanelNode[]): PanelNode => ({
  panel,
  name: SP_COIN_DISPLAY[panel] ?? String(panel),
  visible,
  ...(children && children.length ? { children } : {}),
});

/**
 * Flat array of root panels for settings.mainPanelNode.
 * Buttons are included as children under their respective BUY/SELL subtrees.
 */
export const defaultMainPanelNode: MainPanelNode = [
  n(SP_COIN_DISPLAY.TRADING_STATION_PANEL, true, [
    // BUY subtree (visible by default)
    n(SP_COIN_DISPLAY.BUY_SELECT_PANEL, true, [
      n(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_BUTTON, false),
    ]),

    // SELL subtree (visible by default)
    n(SP_COIN_DISPLAY.SELL_SELECT_PANEL, true, [
      n(SP_COIN_DISPLAY.SPONSORSHIP_SELECT_CONFIG_BUTTON, false),
    ]),

    // Recipient inline panel (default hidden)
    n(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL, false, [
      n(SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL, false),
    ]),

    // Independent UI controls under Trading (default visible)
    n(SP_COIN_DISPLAY.SWAP_ARROW_BUTTON,  true),
    n(SP_COIN_DISPLAY.PRICE_BUTTON,       true),
    n(SP_COIN_DISPLAY.FEE_DISCLOSURE,     true),
    n(SP_COIN_DISPLAY.AFFILIATE_FEE,      true),
  ]),

  // Token selection panels as separate roots
  n(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST,       true),
  n(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST,      true),
  n(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST, false),

  // Other roots (hidden by default)
  n(SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST,     false),
  n(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,         false),
  n(SP_COIN_DISPLAY.SPONSOR_SELECT_PANEL_LIST,   false), // legacy; never persist at runtime
];
