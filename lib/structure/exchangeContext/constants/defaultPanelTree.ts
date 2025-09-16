// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts

import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';
import type {
  MainPanels,      // id-indexed flat list (index === enum id)
  PanelNode,
  MainPanelNode,   // optional legacy single-root shape
} from '@/lib/structure/exchangeContext/types/PanelNode';

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
 * TRADING_STATION_PANEL is visible by default; others are hidden.
 * ✅ TRADING seeds RECIPIENT BUTTON + PANEL (hidden) so they persist to storage.
 * ✅ MANAGEMENT_CONFIG_PANEL is included but remains independent of radio selection.
 */
function buildIdIndexedPanels(): MainPanels {
  const maxId = Math.max(...ALL_IDS);
  const arr: PanelNode[] = new Array(maxId + 1);

  for (const id of ALL_IDS) {
    const isTrading = id === SP_COIN_DISPLAY.TRADING_STATION_PANEL;

    if (id === SP_COIN_DISPLAY.TRADING_STATION_PANEL) {
      arr[id] = n(
        id,
        true,
        [
          n(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_BUTTON, false, []),
          n(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_PANEL,  false, []),
        ]
      );
    } else if (id === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL) {
      // BUY no longer seeds RECIPIENT child
      arr[id] = n(id, false, []);
    } else if (INDEPENDENT_PANELS.includes(id)) {
      // Independent panels are present but not part of the radio group
      arr[id] = n(id, false, []);
    } else {
      arr[id] = n(id, isTrading, []);
    }
  }

  return arr as MainPanels;
}

export const defaultMainPanels: MainPanels = buildIdIndexedPanels();

/**
 * Optional legacy shape exported as a sibling array (not a single root):
 * TRADING visible; RECIPIENT BUTTON + PANEL are children of TRADING; others hidden/childless.
 * MANAGEMENT_CONFIG_PANEL is a separate sibling (independent of radio group).
 */
export const defaultMainPanelNode: MainPanelNode[] = [
  n(SP_COIN_DISPLAY.TRADING_STATION_PANEL, true, [
    n(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_BUTTON, false, []), // element 0 under TRADING
    n(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_PANEL,  false, []), // element 1 under TRADING
  ]),
  n(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL, false, []),
  n(SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL,  false, []),
  n(SP_COIN_DISPLAY.AGENT_SELECT_CONFIG_PANEL,     false, []),
  n(SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,           false, []),
  // Independent (non-radio) panel:
  n(SP_COIN_DISPLAY.MANAGEMENT_CONFIG_PANEL,       false, []),
];
