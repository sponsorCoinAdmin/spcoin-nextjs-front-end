// File: @/lib/structure/exchangeContext/constants/spCoinDisplay.ts

import { SP_COIN_DISPLAY as SP } from '../enums/spCoinDisplay';

/**
 * Main overlay radio members.
 * This list is used for "global overlay radio" and stack gating.
 */
export const MAIN_OVERLAY_GROUP = [
  SP.TRADING_STATION_PANEL,
  SP.BUY_LIST_SELECT_PANEL,
  SP.SELL_LIST_SELECT_PANEL,
  SP.RECIPIENT_LIST_SELECT_PANEL,
  SP.AGENT_LIST_SELECT_PANEL,
  SP.ERROR_MESSAGE_PANEL,
  SP.TOKEN_CONTRACT_PANEL,

  // ✅ Manage overlays are first-class main overlays
  SP.MANAGE_SPONSORSHIPS_PANEL,
  SP.UNSTAKING_SPCOINS_PANEL,
  SP.STAKING_SPCOINS_PANEL,

  // Sponsor + detail overlays
  SP.SPONSOR_LIST_SELECT_PANEL,
  SP.SPONSOR_ACCOUNT_PANEL,
  SP.AGENT_ACCOUNT_PANEL,
  SP.RECIPIENT_ACCOUNT_PANEL,
] as const satisfies readonly SP[];

/**
 * Nested manage-scoped radio members (old model).
 * ✅ Now empty because we removed the legacy container and nested radio behavior.
 */
export const MANAGE_SCOPED = [] as const satisfies readonly SP[];

/**
 * Stack components.
 * Right now it’s the same as main overlays (since manage-scoped is empty).
 *
 * NOTE: Don't use `as const` on variables—only on literals.
 */
export const STACK_COMPONENTS: readonly SP[] = MAIN_OVERLAY_GROUP;

/** Fast membership checks (action-model helpers). */
export const IS_MAIN_OVERLAY: ReadonlySet<SP> = new Set(MAIN_OVERLAY_GROUP);
export const IS_MANAGE_SCOPED: ReadonlySet<SP> = new Set(MANAGE_SCOPED);
export const IS_STACK_COMPONENT: ReadonlySet<SP> = new Set(STACK_COMPONENTS);

/** Dev-only guard against accidental duplicates */
if (process.env.NODE_ENV !== 'production') {
  const checkUnique = (label: string, arr: readonly SP[]) => {
    const s = new Set<SP>();
    for (const v of arr) {
      if (s.has(v)) {
        // eslint-disable-next-line no-console
        console.error(`[spCoinDisplay] Duplicate in ${label}:`, v, SP[v]);
        throw new Error(`[spCoinDisplay] Duplicate in ${label}: ${String(v)} (${SP[v]})`);
      }
      s.add(v);
    }
  };

  checkUnique('MAIN_OVERLAY_GROUP', MAIN_OVERLAY_GROUP);
  checkUnique('MANAGE_SCOPED', MANAGE_SCOPED);
  checkUnique('STACK_COMPONENTS', STACK_COMPONENTS);
}
