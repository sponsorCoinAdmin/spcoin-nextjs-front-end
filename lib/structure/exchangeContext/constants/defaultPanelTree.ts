// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts
import { SP_COIN_DISPLAY } from '@/lib/structure/enums/spCoinDisplay';
import type { MainPanelNode, PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

const n = (panel: SP_COIN_DISPLAY, visible: boolean, children: PanelNode[] = []): PanelNode => ({
  panel,
  name: SP_COIN_DISPLAY[panel] ?? String(panel),
  visible,
  children,
});

/** Default panel tree used when nothing is in storage. */
export const defaultMainPanelNode: MainPanelNode = n(
  SP_COIN_DISPLAY.TRADING_STATION_PANEL,
  true,
  [
    n(SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL,   false),
    n(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL,  false),
    n(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,    false),
    n(SP_COIN_DISPLAY.AGENT_SELECT_PANEL,        false),
    n(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL, false),
  ]
);

/** LocalStorage key used when persisting the mainPanelNode tree. */
export const MAIN_PANEL_NODE_STORAGE_KEY = 'mainPanelNode';
