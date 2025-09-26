// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts

import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';
import type {
  MainPanels,
  PanelNode,
  MainPanelNode,
} from '@/lib/structure/exchangeContext/types/PanelNode';
import { SP_COIN_DISPLAY } from '../enums/spCoinDisplay';

const n = (panel: SP_COIN_DISPLAY, visible: boolean, children: PanelNode[] = []): PanelNode => ({
  panel,
  name: SP_COIN_DISPLAY[panel] ?? String(panel),
  visible,
  children,
});

// Include all ids we need slots for in the id-indexed array.
// NOTE: No MANAGEMENT_CONFIG_PANEL here (removed).
const ALL_IDS: SP_COIN_DISPLAY[] = Array.from(
  new Set<SP_COIN_DISPLAY>([
    ...MAIN_OVERLAY_GROUP,              // includes SPONSOR_SELECT_PANEL_LIST
    SP_COIN_DISPLAY.SELL_SELECT_PANEL,  // child under TRADING_STATION_PANEL
    SP_COIN_DISPLAY.BUY_SELECT_PANEL,   // child under TRADING_STATION_PANEL
    SP_COIN_DISPLAY.SWAP_ARROW_BUTTON,  // child under TRADING_STATION_PANEL
    SP_COIN_DISPLAY.PRICE_BUTTON,       // child under TRADING_STATION_PANEL
    SP_COIN_DISPLAY.FEE_DISCLOSURE,     // child under TRADING_STATION_PANEL
    SP_COIN_DISPLAY.AFFILIATE_FEE,      // child under TRADING_STATION_PANEL
  ])
).sort((a, b) => a - b);

/**
 * Build an **id-indexed** array so defaultMainPanels[id].panel === id.
 *
 * Layout:
 * - TRADING_STATION_PANEL (visible) children:
 *    • BUY_SELECT_PANEL                      (visible by default)
 *         └─ RECIPIENT_SELECT_CONFIG_BUTTON  (hidden by default; component controls it)
 *    • SELL_SELECT_PANEL                     (visible by default)
 *         └─ SPONSORSHIP_SELECT_CONFIG_BUTTON (hidden by default; component controls it)
 *    • RECIPIENT_SELECT_PANEL                (hidden by default)
 *    • SWAP_ARROW_BUTTON                     (visible by default)
 *    • PRICE_BUTTON                          (visible by default)
 *    • FEE_DISCLOSURE                        (visible by default)
 *    • AFFILIATE_FEE                         (visible by default)
 * - BUY_SELECT_PANEL_LIST / SELL_SELECT_PANEL_LIST are sibling ROOTS (visible).
 * - RECIPIENT_SELECT_PANEL_LIST is a sibling ROOT (hidden).
 * - AGENT_SELECT_PANEL_LIST / ERROR_MESSAGE_PANEL / SPONSOR_SELECT_PANEL_LIST are sibling ROOTS (hidden).
 */
function buildIdIndexedPanels(): MainPanels {
  const maxId = Math.max(...ALL_IDS);
  const arr: PanelNode[] = new Array(maxId + 1);

  for (const id of ALL_IDS) {
    if (id === SP_COIN_DISPLAY.TRADING_STATION_PANEL) {
      arr[id] = n(
        id,
        true,
        [
          // BUY subtree (visible by default)
          n(
            SP_COIN_DISPLAY.BUY_SELECT_PANEL,
            true,
            [n(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_BUTTON, false, [])]
          ),

          // SELL subtree (visible by default)
          n(
            SP_COIN_DISPLAY.SELL_SELECT_PANEL,
            true,
            [n(SP_COIN_DISPLAY.SPONSORSHIP_SELECT_CONFIG_BUTTON, false, [])]
          ),

          // Recipient inline panel (default hidden)
          n(
            SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,
            false,
            [n(SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL as SP_COIN_DISPLAY, false, [])]
          ),

          // Independent UI controls under Trading (default visible)
          n(SP_COIN_DISPLAY.SWAP_ARROW_BUTTON,  true, []),
          n(SP_COIN_DISPLAY.PRICE_BUTTON,       true, []),
          n(SP_COIN_DISPLAY.FEE_DISCLOSURE,     true, []),
          n(SP_COIN_DISPLAY.AFFILIATE_FEE,      true, []),
        ]
      );
    } else if (id === SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST) {
      arr[id] = n(id, true, []);
    } else if (id === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST) {
      arr[id] = n(id, true, []);
    } else if (id === SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST) {
      arr[id] = n(id, false, []);
    } else {
      // All other roots default hidden (AGENT / ERROR / SPONSOR_SELECT_PANEL_LIST, etc.)
      arr[id] = n(id, false, []);
    }
  }

  return arr as MainPanels;
}

export const defaultMainPanels: MainPanels = buildIdIndexedPanels();

/**
 * Optional legacy shape (sibling array).
 * Keep defaults consistent with the id-indexed build above.
 */
export const defaultMainPanelNode: MainPanelNode[] = [
  n(SP_COIN_DISPLAY.TRADING_STATION_PANEL, true, [
    // BUY subtree (visible by default)
    n(SP_COIN_DISPLAY.BUY_SELECT_PANEL, true, [
      n(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_BUTTON, false, []),
    ]),

    // SELL subtree (visible by default)
    n(SP_COIN_DISPLAY.SELL_SELECT_PANEL, true, [
      n(SP_COIN_DISPLAY.SPONSORSHIP_SELECT_CONFIG_BUTTON, false, []),
    ]),

    // Recipient inline panel (default hidden)
    n(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL, false, [
      n(SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL as SP_COIN_DISPLAY, false, []),
    ]),

    // Independent UI controls under Trading (default visible)
    n(SP_COIN_DISPLAY.SWAP_ARROW_BUTTON,  true, []),
    n(SP_COIN_DISPLAY.PRICE_BUTTON,       true, []),
    n(SP_COIN_DISPLAY.FEE_DISCLOSURE,     true, []),
    n(SP_COIN_DISPLAY.AFFILIATE_FEE,      true, []),
  ]),

  n(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST,       true,  []),
  n(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST,      true,  []),
  n(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST, false, []),
  n(SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST,     false, []),
  n(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,         false, []),
  n(SP_COIN_DISPLAY.SPONSOR_SELECT_PANEL_LIST,   false, []),
];
