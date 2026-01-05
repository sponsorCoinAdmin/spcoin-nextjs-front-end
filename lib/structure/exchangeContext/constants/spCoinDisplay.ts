// File: @/lib/structure/exchangeContext/constants/spCoinDisplay.ts

import { SP_COIN_DISPLAY } from '../enums/spCoinDisplay';

/**
 * Action-model groups (explicit, readable).
 * These are the membership lists used for "global overlay radio" and stack gating.
 */
export const MAIN_OVERLAY_GROUP = [
  SP_COIN_DISPLAY.TRADING_STATION_PANEL,
  SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
  SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL,

  // ✅ Manage overlays are first-class main overlays
  SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL,
  // SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
  SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
  SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL,
  SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL,
  SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL,
  SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL,
  SP_COIN_DISPLAY.CLAIM_SPONSOR_REWARDS_LIST_PANEL,
  SP_COIN_DISPLAY.MANAGE_AGENT_PANEL,
  SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,

  // NOTE:
  // If MANAGE_SPONSOR_PANEL is meant to be a full overlay sibling too,
  // add it here (and in panelRegistry/defaultPanelTree).
  // SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
] as const satisfies readonly SP_COIN_DISPLAY[];

/**
 * Nested manage-scoped radio members (old model).
 * ✅ Now empty because we removed the legacy container and nested radio behavior.
 */
export const MANAGE_SCOPED = [] as const satisfies readonly SP_COIN_DISPLAY[];

export const STACK_COMPONENTS = [
  ...MAIN_OVERLAY_GROUP,
  ...MANAGE_SCOPED,
] as const satisfies readonly SP_COIN_DISPLAY[];

/** Fast membership checks (action-model helpers). */
export const IS_MAIN_OVERLAY = new Set<number>(MAIN_OVERLAY_GROUP.map(Number));
export const IS_MANAGE_SCOPED = new Set<number>(MANAGE_SCOPED.map(Number));
export const IS_STACK_COMPONENT = new Set<number>(STACK_COMPONENTS.map(Number));
