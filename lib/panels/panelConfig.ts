// File: @/lib/panels/panelConfig.ts
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
 *
 * ✅ Manage panels are first-class overlays (no container/group).
 * ✅ Pending Rewards is NOT an overlay: it is a local inline child of Manage Sponsorships.
 */
export const PANELS: readonly PanelDef[] = [
  // Root app container for trading
  { id: SP.MAIN_TRADING_PANEL, kind: 'root', defaultVisible: true },

  // Non-radio chrome under main root
  {
    id: SP.TRADE_CONTAINER_HEADER,
    kind: 'panel',
    parent: SP.MAIN_TRADING_PANEL,
    defaultVisible: true,
  },

  /**
   * Main overlays (radio group: mainOverlay)
   *
   * Children of TRADE_CONTAINER_HEADER (matches updated structural registry).
   */
  {
    id: SP.TRADING_STATION_PANEL,
    kind: 'panel',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: true,
  },
  {
    id: SP.BUY_LIST_SELECT_PANEL,
    kind: 'list',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: true,
  },
  {
    id: SP.SELL_LIST_SELECT_PANEL,
    kind: 'list',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: true,
  },
  {
    id: SP.RECIPIENT_LIST_SELECT_PANEL,
    kind: 'list',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },
  {
    id: SP.AGENT_LIST_SELECT_PANEL,
    kind: 'list',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },
  {
    id: SP.ERROR_MESSAGE_PANEL,
    kind: 'panel',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },

  // Sponsor list (GLOBAL overlay, not persisted)
  {
    id: SP.SPONSOR_LIST_SELECT_PANEL,
    kind: 'list',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },

  // Manage overlays as first-class main overlays (same radio group)
  {
    id: SP.MANAGE_SPONSORSHIPS_PANEL,
    kind: 'panel',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },

  /**
   * ✅ Pending Rewards is LOCAL/INLINE state under Manage Sponsorships.
   * - NOT in mainOverlay radio group
   * - NOT a stack overlay
   * - Must not be auto-hidden by overlay switching
   */
  {
    id: SP.MANAGE_PENDING_REWARDS,
    kind: 'panel',
    parent: SP.MANAGE_SPONSORSHIPS_PANEL,
    defaultVisible: false,
  },

  {
    id: SP.UNSTAKING_SPCOINS_PANEL,
    kind: 'panel',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },
  {
    id: SP.STAKING_SPCOINS_PANEL,
    kind: 'panel',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },
  {
    id: SP.MANAGE_RECIPIENTS_PANEL,
    kind: 'panel',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },
  {
    id: SP.MANAGE_AGENTS_PANEL,
    kind: 'panel',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },
  {
    id: SP.CLAIM_SPONSOR_REWARDS_LIST_PANEL,
    kind: 'panel',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },

  // Detail/manage overlays (also full-screen overlays in the same radio set)
  {
    id: SP.MANAGE_AGENT_PANEL,
    kind: 'panel',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },
  {
    id: SP.MANAGE_RECIPIENT_PANEL,
    kind: 'panel',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },
  {
    id: SP.MANAGE_SPONSOR_PANEL,
    kind: 'panel',
    parent: SP.TRADE_CONTAINER_HEADER,
    group: 'mainOverlay',
    defaultVisible: false,
  },

  // Trading view subtree (non-radio)
  {
    id: SP.SELL_SELECT_PANEL,
    kind: 'panel',
    parent: SP.TRADING_STATION_PANEL,
    defaultVisible: true,
  },
  {
    id: SP.BUY_SELECT_PANEL,
    kind: 'panel',
    parent: SP.TRADING_STATION_PANEL,
    defaultVisible: true,
  },
  {
    id: SP.ADD_SPONSORSHIP_PANEL,
    kind: 'panel',
    parent: SP.TRADING_STATION_PANEL,
    defaultVisible: false,
  },
  {
    id: SP.CONFIG_SPONSORSHIP_PANEL,
    kind: 'panel',
    parent: SP.ADD_SPONSORSHIP_PANEL,
    defaultVisible: false,
  },

  // Optional trading config panel (if used)
  {
    id: SP.CONFIG_SLIPPAGE_PANEL,
    kind: 'panel',
    parent: SP.TRADING_STATION_PANEL,
    defaultVisible: false,
  },

  // Inline controls under Trading
  {
    id: SP.SWAP_ARROW_BUTTON,
    kind: 'control',
    parent: SP.TRADING_STATION_PANEL,
    defaultVisible: true,
  },
  {
    id: SP.CONNECT_PRICE_BUTTON,
    kind: 'control',
    parent: SP.TRADING_STATION_PANEL,
    defaultVisible: true,
  },
  {
    id: SP.FEE_DISCLOSURE,
    kind: 'control',
    parent: SP.TRADING_STATION_PANEL,
    defaultVisible: true,
  },
  {
    id: SP.AFFILIATE_FEE,
    kind: 'control',
    parent: SP.TRADING_STATION_PANEL,
    defaultVisible: true,
  },

  // Buttons
  {
    id: SP.ADD_SPONSORSHIP_BUTTON,
    kind: 'button',
    parent: SP.BUY_SELECT_PANEL,
    defaultVisible: false,
  },
  {
    id: SP.MANAGE_SPONSORSHIPS_BUTTON,
    kind: 'button',
    parent: SP.SELL_SELECT_PANEL,
    defaultVisible: false,
  },
] as const;
