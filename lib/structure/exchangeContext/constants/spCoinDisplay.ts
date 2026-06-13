// File: lib/structure/exchangeContext/constants/spCoinDisplay.ts

import { SP_COIN_DISPLAY as SP } from '../enums/spCoinDisplay';

/**
 * Main overlay radio members.
 * This list is used for "global overlay radio" and stack gating.
 *
 * IMPORTANT:
 * - These are mutually exclusive overlays (radio behavior).
 * - Do NOT put child-mode panels here (ex: AGENTS, RECIPIENTS, SPONSORS).
 */
export const MAIN_RADIO_OVERLAY_PANELS = [
  // Core trading overlay
  SP.TRADING_STATION_PANEL,

  // Token selectors
  SP.TOKEN_LIST_SELECT_PANEL,

  // ✅ Account list selector (new)
  SP.ACCOUNT_LIST_SELECT_PANEL,

  // System / misc overlays
  SP.ERROR_MESSAGE_PANEL,

  // ✅ Manage overlays are first-class main overlays
  SP.MANAGE_SPONSORSHIPS_PANEL,
  SP.STAKING_SPCOINS_PANEL,

  // Rewards list overlay root
  SP.ACCOUNT_LIST_REWARDS_PANEL,

  // Shared / detail overlays
  SP.ACCOUNT_PANEL,

  // Token contract overlay (if you want it stackable/radio, keep it here; otherwise remove)
  SP.TOKEN_PANEL,
] as const satisfies readonly SP[];

/**
 * Nested manage-scoped radio members (old model).
 * ✅ Now empty because we removed the legacy container and nested radio behavior.
 */
export const MANAGE_SCOPED = [] as const satisfies readonly SP[];

// ACCOUNT_PANEL children: exactly 0 or 1 visible.
export const ACCOUNT_PANEL_MODES = [
  SP.ACTIVE_ACCOUNT,
  SP.SPONSOR_ACCOUNT,
  SP.RECIPIENT_ACCOUNT,
  SP.AGENT_ACCOUNT,
] as const satisfies readonly SP[];

// TOKEN_PANEL children: exactly 0 or 1 visible.
export const TOKEN_CONTRACT_PANEL_MODES = [
  SP.BUY_CONTRACT,
  SP.SELL_CONTRACT,
  SP.PREVIEW_CONTRACT,
] as const satisfies readonly SP[];

// ACCOUNT_LIST_SELECT_PANEL children: exactly 0 or 1 visible.
export const ACCOUNT_LIST_SELECT_PANEL_MODES = [
  SP.SPONSOR_LIST,
  SP.RECIPIENT_LIST,
  SP.AGENT_LIST,
] as const satisfies readonly SP[];

// ACCOUNT_LIST_REWARDS_PANEL children: exactly 0 or 1 visible.
export const REWARDS_GROUP_MODES = [
  SP.ACTIVE_SPONSORSHIPS,
  SP.PENDING_SPONSOR_REWARDS,
  SP.PENDING_RECIPIENT_REWARDS,
  SP.PENDING_AGENT_REWARDS,
] as const satisfies readonly SP[];

export const RADIO_PANEL_GROUPS = [
  { name: 'MAIN_RADIO_OVERLAY_PANELS', members: MAIN_RADIO_OVERLAY_PANELS },
  { name: 'ACCOUNT_PANEL_MODES', members: ACCOUNT_PANEL_MODES },
  { name: 'TOKEN_CONTRACT_PANEL_MODES', members: TOKEN_CONTRACT_PANEL_MODES },
  {
    name: 'ACCOUNT_LIST_SELECT_PANEL_MODES',
    members: ACCOUNT_LIST_SELECT_PANEL_MODES,
  },
  { name: 'REWARDS_GROUP_MODES', members: REWARDS_GROUP_MODES },
] as const;

/**
 * Stack components.
 * Right now it’s the same as main overlays (since manage-scoped is empty).
 */
export const STACK_COMPONENTS = [...MAIN_RADIO_OVERLAY_PANELS] as const satisfies readonly SP[];

/**
 * ✅ Fast membership checks (action-model helpers).
 *
 * CRITICAL:
 * `usePanelTree` performs membership checks using Number(panel),
 * so these sets MUST be numeric to avoid enum-instance / import-path mismatches.
 */
export const IS_MAIN_RADIO_OVERLAY_PANEL: ReadonlySet<number> = new Set(
  MAIN_RADIO_OVERLAY_PANELS.map(Number),
);
export const IS_MANAGE_SCOPED: ReadonlySet<number> = new Set(
  MANAGE_SCOPED.map(Number),
);
export const IS_STACK_COMPONENT: ReadonlySet<number> = new Set(
  STACK_COMPONENTS.map(Number),
);

/** Dev-only guard against accidental duplicates */
if (process.env.NODE_ENV !== 'production') {
  const checkUnique = (label: string, arr: readonly SP[]) => {
    const s = new Set<number>();
    for (const v of arr) {
      const id = Number(v);
      if (s.has(id)) {
        // eslint-disable-next-line no-console
        console.error(`[spCoinDisplay] Duplicate in ${label}:`, v, SP[v]);
        throw new Error(
          `[spCoinDisplay] Duplicate in ${label}: ${String(v)} (${SP[v]})`,
        );
      }
      s.add(id);
    }
  };

  checkUnique('MAIN_RADIO_OVERLAY_PANELS', MAIN_RADIO_OVERLAY_PANELS);
  checkUnique('MANAGE_SCOPED', MANAGE_SCOPED);
  checkUnique('STACK_COMPONENTS', STACK_COMPONENTS);
}
