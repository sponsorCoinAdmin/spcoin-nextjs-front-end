// File: @/lib/panels/panel.config.ts
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

export type PanelKind = 'root' | 'panel' | 'list' | 'button' | 'control';
export type GroupId = 'mainOverlay';

export type PanelDef = {
  id: SP;
  kind: PanelKind;
  defaultVisible: boolean;
  /** Parent in the debug/virtual tree (purely structural, not persisted) */
  parent?: SP;
  /** Radio-group membership (exclusivity handled by the store in Phase 2) */
  group?: GroupId;
  /** Optional UI label override (defaults to enum name) */
  label?: string;
};

/**
 * Single source of truth for panels.
 * Add a new panel by inserting one object here.
 */
export const PANELS: readonly PanelDef[] = [
  // Root app container for trading
  { id: SP.MAIN_TRADING_PANEL, kind: 'root', defaultVisible: true },

  // Non-radio chrome under main root
  { id: SP.TRADE_CONTAINER_HEADER, kind: 'panel', parent: SP.MAIN_TRADING_PANEL, defaultVisible: true },

  // Main overlays (radio group: mainOverlay)
  { id: SP.TRADING_STATION_PANEL,       kind: 'panel', parent: SP.MAIN_TRADING_PANEL, group: 'mainOverlay', defaultVisible: true },
  { id: SP.BUY_LIST_SELECT_PANEL,       kind: 'list',  parent: SP.MAIN_TRADING_PANEL, group: 'mainOverlay', defaultVisible: true },
  { id: SP.SELL_LIST_SELECT_PANEL,      kind: 'list',  parent: SP.MAIN_TRADING_PANEL, group: 'mainOverlay', defaultVisible: true },
  { id: SP.RECIPIENT_LIST_SELECT_PANEL, kind: 'list',  parent: SP.MAIN_TRADING_PANEL, group: 'mainOverlay', defaultVisible: false },
  { id: SP.AGENT_LIST_SELECT_PANEL,     kind: 'list',  parent: SP.MAIN_TRADING_PANEL, group: 'mainOverlay', defaultVisible: false },
  { id: SP.ERROR_MESSAGE_PANEL,         kind: 'panel', parent: SP.MAIN_TRADING_PANEL, group: 'mainOverlay', defaultVisible: false },
  { id: SP.MANAGE_SPONSORSHIPS_PANEL,   kind: 'panel', parent: SP.MAIN_TRADING_PANEL, group: 'mainOverlay', defaultVisible: false },
  // legacy (kept so old states don’t break)
  { id: SP.SPONSOR_LIST_SELECT_PANEL,   kind: 'list',  parent: SP.MAIN_TRADING_PANEL, group: 'mainOverlay', defaultVisible: false },

  // Trading view subtree (non-radio)
  { id: SP.SELL_SELECT_PANEL,           kind: 'panel',   parent: SP.TRADING_STATION_PANEL, defaultVisible: true },
  { id: SP.BUY_SELECT_PANEL,            kind: 'panel',   parent: SP.TRADING_STATION_PANEL, defaultVisible: true },
  { id: SP.ADD_SPONSORSHIP_PANEL,       kind: 'panel',   parent: SP.TRADING_STATION_PANEL, defaultVisible: false },
  { id: SP.CONFIG_SPONSORSHIP_PANEL,    kind: 'panel',   parent: SP.ADD_SPONSORSHIP_PANEL, defaultVisible: false },

  // Inline controls under Trading
  { id: SP.SWAP_ARROW_BUTTON,           kind: 'control', parent: SP.TRADING_STATION_PANEL, defaultVisible: true },
  { id: SP.PRICE_BUTTON,                kind: 'control', parent: SP.TRADING_STATION_PANEL, defaultVisible: true },
  { id: SP.FEE_DISCLOSURE,              kind: 'control', parent: SP.TRADING_STATION_PANEL, defaultVisible: true },
  { id: SP.AFFILIATE_FEE,               kind: 'control', parent: SP.TRADING_STATION_PANEL, defaultVisible: true },

  // Buttons
  { id: SP.ADD_SPONSORSHIP_BUTTON,      kind: 'button',  parent: SP.BUY_SELECT_PANEL,  defaultVisible: false },
  { id: SP.MANAGE_SPONSORSHIPS_BUTTON,  kind: 'button',  parent: SP.SELL_SELECT_PANEL, defaultVisible: false },
] as const;
