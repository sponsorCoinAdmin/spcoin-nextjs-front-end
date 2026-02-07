// File: @/lib/structure/exchangeContext/constants/spCoinDisplay.ts

import { SP_COIN_DISPLAY as SP } from '../enums/spCoinDisplay';

/**
 * Main overlay radio members.
 * This list is used for "global overlay radio" and stack gating.
 *
 * IMPORTANT:
 * - These are mutually exclusive overlays (radio behavior).
 * - Do NOT put child-mode panels here (ex: AGENTS, RECIPIENTS, SPONSORS).
 */
export const MAIN_OVERLAY_GROUP = [
  // Core trading overlay
  SP.TRADING_STATION_PANEL,

  // Token selectors
  SP.PANEL_LIST_SELECT_PANEL,
  SP.TOKEN_LIST_SELECT_PANEL,
  SP.BUY_LIST_SELECT_PANEL,
  SP.SELL_LIST_SELECT_PANEL,

  // ✅ OLD: legacy list overlays (kept during migration)
  SP.RECIPIENT_LIST_SELECT_PANEL,
  SP.AGENT_LIST_SELECT_PANEL,

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
  SP.TOKEN_CONTRACT_PANEL,
] as const satisfies readonly SP[];

/**
 * Nested manage-scoped radio members (old model).
 * ✅ Now empty because we removed the legacy container and nested radio behavior.
 */
export const MANAGE_SCOPED = [] as const satisfies readonly SP[];

/**
 * Stack components.
 * Right now it’s the same as main overlays (since manage-scoped is empty).
 */
export const STACK_COMPONENTS = [...MAIN_OVERLAY_GROUP] as const satisfies readonly SP[];

/**
 * ✅ Fast membership checks (action-model helpers).
 *
 * CRITICAL:
 * `usePanelTree` performs membership checks using Number(panel),
 * so these sets MUST be numeric to avoid enum-instance / import-path mismatches.
 */
export const IS_MAIN_OVERLAY: ReadonlySet<number> = new Set(
  MAIN_OVERLAY_GROUP.map(Number),
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

  checkUnique('MAIN_OVERLAY_GROUP', MAIN_OVERLAY_GROUP);
  checkUnique('MANAGE_SCOPED', MANAGE_SCOPED);
  checkUnique('STACK_COMPONENTS', STACK_COMPONENTS);
}
