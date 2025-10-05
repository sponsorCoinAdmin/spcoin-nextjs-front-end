// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts
import type { SpCoinPanelTree, PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { SP_COIN_DISPLAY as SP } from '../enums/spCoinDisplay';

const n = (panel: SP, visible: boolean, children?: PanelNode[]): PanelNode => ({
  panel,
  name: SP[panel] ?? String(panel),
  visible,
  ...(children && children.length ? { children } : {}),
});

// Single root with children (matches your desired display)
export const defaultSpCoinPanelTree: SpCoinPanelTree = [
  n(SP.MAIN_TRADING_PANEL, true, [
    // ✅ header is a regular (non-radio) child, visible by default
    n(SP.TRADE_CONTAINER_HEADER, true),

    // Radio overlays (visibility managed by MAIN_OVERLAY_GROUP)
    n(SP.TRADING_STATION_PANEL,      true),
    n(SP.BUY_SELECT_PANEL_LIST,      true),
    n(SP.SELL_SELECT_PANEL_LIST,     true),
    n(SP.RECIPIENT_SELECT_PANEL_LIST,false),
    n(SP.AGENT_SELECT_PANEL_LIST,    false),
    n(SP.ERROR_MESSAGE_PANEL,        false),
    n(SP.MANAGE_SPONSORSHIPS_PANEL,  false),
  ]),
];
