// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts
import type { SpCoinPanelTree, PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { SP_COIN_DISPLAY as SP } from '../enums/spCoinDisplay';

const n = (panel: SP, visible: boolean, children?: PanelNode[]): PanelNode => ({
  panel,
  name: SP[panel] ?? String(panel),
  visible,
  ...(children && children.length ? { children } : {}),
});

/**
 * Seed all panels in a single rooted tree.
 * Defaults: items not explicitly "true" are set to "false".
 *
 * Intentional defaults per requirements:
 *  - MAIN_TRADING_PANEL, TRADE_CONTAINER_HEADER, TRADING_STATION_PANEL → true
 *  - SELL_SELECT_PANEL, BUY_SELECT_PANEL → true (inline panels inside Trading Station)
 *  - MANAGE_SPONSORSHIPS_BUTTON / ADD_SPONSORSHIP_BUTTON → false (turn on when token is SpCoin)
 *  - SWAP_ARROW_BUTTON, PRICE_BUTTON, FEE_DISCLOSURE → true
 *  - Everything else → false
 *
 * Note: SPONSOR_SELECT_PANEL_LIST is **never persisted**, so it's not seeded here.
 */
export const defaultSpCoinPanelTree: SpCoinPanelTree = [
  n(SP.MAIN_TRADING_PANEL, true, [
    // Header (non-radio)
    n(SP.TRADE_CONTAINER_HEADER, true),

    // Radio overlays (managed by MAIN_OVERLAY_GROUP):
    // Only TRADING_STATION_PANEL is true by default; the rest are false.
    n(SP.TRADING_STATION_PANEL, true, [
      // Inline select panels live under Trading Station and start visible
      n(SP.SELL_SELECT_PANEL, true, [
        n(SP.MANAGE_SPONSORSHIPS_BUTTON, false),
      ]),
      n(SP.BUY_SELECT_PANEL, true, [
        n(SP.ADD_SPONSORSHIP_BUTTON, false),
      ]),
    ]),
    n(SP.BUY_SELECT_PANEL_LIST, false),
    n(SP.SELL_SELECT_PANEL_LIST, false),
    n(SP.RECIPIENT_SELECT_PANEL_LIST, false),
    n(SP.AGENT_SELECT_PANEL_LIST, false),
    n(SP.ERROR_MESSAGE_PANEL, false),
    n(SP.MANAGE_SPONSORSHIPS_PANEL, false),

    // Inline/aux panels (default off)
    n(SP.ADD_SPONSORSHIP_PANEL, false),
    n(SP.CONFIG_SPONSORSHIP_PANEL, false),

    // Default-on widgets
    n(SP.SWAP_ARROW_BUTTON, true),
    n(SP.PRICE_BUTTON, true),
    n(SP.FEE_DISCLOSURE, true),

    // Default-off widget
    n(SP.AFFILIATE_FEE, false),
  ]),
];
