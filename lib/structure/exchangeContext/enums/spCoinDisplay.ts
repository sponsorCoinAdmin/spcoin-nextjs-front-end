// File: @/lib/structure/exchangeContext/enums/spCoinDisplay.ts

/**
 * IMPORTANT:
 * - This enum is persisted/serialized in multiple places (panel tree, visibility maps, etc).
 * - Do NOT reorder existing members. Add new members at the end (append-only).
 */
export enum SP_COIN_DISPLAY {
  ADD_SPONSORSHIP_BUTTON,
  ADD_SPONSORSHIP_PANEL,
  AFFILIATE_FEE,
  BUY_LIST_SELECT_PANEL,
  BUY_SELECT_PANEL,
  CONFIG_SLIPPAGE_PANEL,
  CONFIG_SPONSORSHIP_PANEL,
  CONNECT_TRADE_BUTTON,
  ERROR_MESSAGE_PANEL,
  EXCHANGE_TRADING_PAIR,
  FEE_DISCLOSURE,
  MAIN_TRADING_PANEL,

  // Manage / hub
  MANAGE_PENDING_REWARDS,
  MANAGE_SPONSORSHIPS_BUTTON,

  // Sponsor list select sub-panels (modes)
  ACTIVE_SPONSORSHIPS,
  PENDING_SPONSOR_REWARDS,
  PENDING_RECIPIENT_REWARDS,
  PENDING_AGENT_REWARDS,

  SPONSOR_ACCOUNT,
  RECIPIENT_ACCOUNT,
  AGENT_ACCOUNT,

  // Manage overlay
  MANAGE_SPONSORSHIPS_PANEL,

  // Trading list overlays
  TOKEN_LIST_SELECT_PANEL,
  SELL_SELECT_PANEL,
  TOKEN_CONTRACT_PANEL, // never persist (container only)
  STAKING_SPCOINS_PANEL,
  SWAP_ARROW_BUTTON,
  TRADE_CONTAINER_HEADER,
  TRADING_STATION_PANEL,
  UNDEFINED,

  CHEVRON_DOWN_OPEN_PENDING,

  // First-class list overlays (new)
  ACCOUNT_LIST_REWARDS_PANEL,

  // Legacy list overlays (migration)
  AGENT_LIST_SELECT_PANEL,
  RECIPIENT_LIST_SELECT_PANEL,

  // Token / account overlays
  ACCOUNT_PANEL,

  // ✅ NEW: TOKEN_CONTRACT_PANEL children (append-only)
  BUY_TOKEN,
  SELL_TOKEN,
}
