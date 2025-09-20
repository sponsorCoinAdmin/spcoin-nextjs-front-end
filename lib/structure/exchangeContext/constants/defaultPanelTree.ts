// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts

import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';
import type {
  MainPanels,      // id-indexed flat list (index === enum id)
  PanelNode,
  MainPanelNode,   // optional legacy single-root shape
} from '@/lib/structure/exchangeContext/types/PanelNode';
import { SP_COIN_DISPLAY } from '../enums/spCoinDisplay';

const n = (panel: SP_COIN_DISPLAY, visible: boolean, children: PanelNode[] = []): PanelNode => ({
  panel,
  name: SP_COIN_DISPLAY[panel] ?? String(panel),
  visible,
  children,
});

// Panels that should *not* participate in the main "radio" group behavior.
const INDEPENDENT_PANELS: SP_COIN_DISPLAY[] = [
  SP_COIN_DISPLAY.MANAGEMENT_CONFIG_PANEL,
];

// Build over both radio-group panels and independent panels, while the
// radio behavior itself should only consider MAIN_OVERLAY_GROUP.
const ALL_IDS: SP_COIN_DISPLAY[] = Array.from(
  new Set<SP_COIN_DISPLAY>([...MAIN_OVERLAY_GROUP, ...INDEPENDENT_PANELS])
).sort((a, b) => a - b);

/**
 * Build an **id-indexed** array so defaultMainPanels[id].panel === id.
 *
 * Layout:
 * - TRADING_STATION_PANEL (visible) children:
 *    • RECIPIENT_SELECT_CONFIG_BUTTON (visible)
 *    • RECIPIENT_SELECT_PANEL (visible)
 *        └─ RECIPIENT_CONFIG_PANEL (hidden)
 * - BUY_SELECT_PANEL_LIST is a sibling ROOT (visible, **no children** per request).
 * - SELL_SELECT_PANEL_LIST is a sibling ROOT (visible, no children).
 * - RECIPIENT_SELECT_PANEL_LIST is a sibling ROOT (hidden).
 * - AGENT_SELECT_PANEL_LIST and ERROR_MESSAGE_PANEL are sibling ROOTS (hidden).
 * - MANAGEMENT_CONFIG_PANEL also exists as an independent ROOT (hidden).
 */
function buildIdIndexedPanels(): MainPanels {
  const maxId = Math.max(...ALL_IDS);
  const arr: PanelNode[] = new Array(maxId + 1);

  for (const id of ALL_IDS) {
    if (id === SP_COIN_DISPLAY.TRADING_STATION_PANEL) {
      // TRADING root with recipient-related children (+ RECIPIENT_CONFIG_PANEL under RECIPIENT_SELECT_PANEL)
      arr[id] = n(
        id,
        true,
        [
          n(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_BUTTON, true, []),
          n(
            SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,
            true,
            [
              n(SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL as SP_COIN_DISPLAY, false, []),
            ]
          ),
        ]
      );
    } else if (id === SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST) {
      // BUY is a sibling root (visible) — **no children**
      arr[id] = n(id, true, []);
    } else if (id === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST) {
      // SELL is a sibling root (visible) — no children
      arr[id] = n(id, true, []);
    } else if (id === SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST) {
      // Recipient list lives at root level (hidden by default)
      arr[id] = n(id, false, []);
    } else if (INDEPENDENT_PANELS.includes(id)) {
      // Independent panel as a root (hidden)
      arr[id] = n(id, false, []);
    } else {
      // Other ids default hidden as roots
      arr[id] = n(id, false, []);
    }
  }

  return arr as MainPanels;
}

export const defaultMainPanels: MainPanels = buildIdIndexedPanels();

/**
 * Optional legacy shape exported as a sibling array (not a single root).
 * Mirrors the required localStorage structure with the child under RECIPIENT_SELECT_PANEL
 * and **no children** under BUY_SELECT_PANEL_LIST.
 */
export const defaultMainPanelNode: MainPanelNode[] = [
  n(SP_COIN_DISPLAY.TRADING_STATION_PANEL, true, [
    n(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_BUTTON, true, []),
    n(
      SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,
      true,
      [
        n(SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL as SP_COIN_DISPLAY, false, []),
      ]
    ),
  ]),

  // BUY as a sibling root (visible, **no children**)
  n(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST, true, []),

  // SELL as a sibling root (visible, no children)
  n(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST, true, []),

  // Recipient list as its own root (hidden)
  n(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST, false, []),

  // Sibling roots (hidden by default)
  n(SP_COIN_DISPLAY.AGENT_SELECT_PANEL_LIST, false, []),
  n(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,     false, []),

  // Independent (non-radio) panel as a root
  n(SP_COIN_DISPLAY.MANAGEMENT_CONFIG_PANEL, false, []),
];
