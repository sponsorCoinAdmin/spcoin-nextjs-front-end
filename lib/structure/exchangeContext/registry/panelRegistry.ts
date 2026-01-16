// File: @/lib/structure/exchangeContext/registry/panelRegistry.ts
//
// Canonical registry for ALL SponsorCoin panels.
// Structural metadata only (NO UI logic):
//   • Panel definitions (PANEL_DEFS)
//   • Parent → child relationships
//   • Derived helpers (CHILDREN, KINDS, PANEL_BY_ID)
//
// Overlay membership lists are defined as "action-model groups" in spCoinDisplay.ts
//

import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

import {
  MAIN_OVERLAY_GROUP as MAIN_OVERLAY_GROUP_MODEL,
  MANAGE_SCOPED as MANAGE_SCOPED_MODEL,
  STACK_COMPONENTS as STACK_COMPONENTS_MODEL,
  IS_MAIN_OVERLAY,
  IS_MANAGE_SCOPED,
  IS_STACK_COMPONENT,
} from '@/lib/structure/exchangeContext/constants/spCoinDisplay';

export type PanelKind = 'root' | 'panel' | 'button' | 'list' | 'control';

export type PanelDef = Readonly<{
  id: SP;
  kind: PanelKind;

  /**
   * If true: participates in the GLOBAL overlay radio group.
   * NOTE: overlay membership is sourced from action-model lists.
   */
  overlay?: boolean;

  /** Cold-start visibility (persisted state may override) */
  defaultVisible?: boolean;

  /** Structural children (tree shape only) */
  children?: readonly SP[];
}>;

/* ─────────────────────────────── Grouping Helpers ─────────────────────────────── */

const EXCHANGE_TRADING_PAIR_CHILDREN: readonly SP[] = [
  SP.SELL_SELECT_PANEL,
  SP.SWAP_ARROW_BUTTON,
  SP.BUY_SELECT_PANEL,
] as const;

const TRADING_CHILDREN: readonly SP[] = [
  SP.CONFIG_SLIPPAGE_PANEL,
  SP.EXCHANGE_TRADING_PAIR,
  SP.ADD_SPONSORSHIP_PANEL,
  SP.CONNECT_TRADE_BUTTON,
  SP.FEE_DISCLOSURE,
  SP.AFFILIATE_FEE,
] as const;

const SPONSOR_LIST_SELECT_CHILDREN: readonly SP[] = [
  SP.UNSPONSOR_SP_COINS,
  SP.CLAIM_PENDING_SPONSOR_COINS,
  SP.CLAIM_PENDING_RECIPIENT_COINS,
  SP.CLAIM_PENDING_AGENT_COINS,
] as const;

/**
 * Primary overlay container under MAIN_TRADING_PANEL
 *
 * ✅ Manage panels are first-class overlays mounted here.
 * ✅ EXCEPTION: MANAGE_PENDING_REWARDS is NOT a sibling overlay; it is nested under MANAGE_SPONSORSHIPS_PANEL.
 *
 * NOTE: Do NOT duplicate ids here.
 */
const TRADE_HEADER_CHILDREN: readonly SP[] = [
  // Core overlay
  SP.TRADING_STATION_PANEL,

  // Token selectors
  SP.BUY_LIST_SELECT_PANEL,
  SP.SELL_LIST_SELECT_PANEL,

  // ✅ NEW: first-class list overlays (Sponsor-style panel overlays)
  SP.RECIPIENT_LIST_SELECT_PANEL,
  SP.AGENT_LIST_SELECT_PANEL,

  // ✅ OLD: legacy list overlays (kept during migration)
  SP.RECIPIENT_LIST_SELECT_PANEL_OLD,
  SP.AGENT_LIST_SELECT_PANEL_OLD,

  // Errors / hub
  SP.ERROR_MESSAGE_PANEL,

  // ✅ First-class "manage" overlays
  SP.MANAGE_SPONSORSHIPS_PANEL,
  SP.UNSTAKING_SPCOINS_PANEL,
  SP.STAKING_SPCOINS_PANEL,

  // Sponsor list select (parent) + sub-panels
  SP.SPONSOR_LIST_SELECT_PANEL,

  // Detail overlays
  SP.AGENT_ACCOUNT_PANEL,
  SP.RECIPIENT_ACCOUNT_PANEL,

  // ✅ Shared detail panel should live at same level as other overlays
  SP.SPONSOR_ACCOUNT_PANEL,

  // Token contract overlay
  SP.TOKEN_CONTRACT_PANEL,
] as const;

const MAIN_TRADING_CHILDREN: readonly SP[] = [SP.TRADE_CONTAINER_HEADER] as const;

/* ─────────────────────────────── Panel Definitions ─────────────────────────────── */

/**
 * Helper to auto-set overlay flag from action-model set.
 * Avoids repeating `overlay: true` all over the file.
 *
 * NOTE: IS_MAIN_OVERLAY is numeric (Set<number>), so compare with Number(d.id).
 */
const def = (d: Omit<PanelDef, 'overlay'>): PanelDef => ({
  ...d,
  ...(IS_MAIN_OVERLAY.has(Number(d.id)) ? { overlay: true } : null),
});

export const PANEL_DEFS: readonly PanelDef[] = [
  // Root
  def({
    id: SP.MAIN_TRADING_PANEL,
    kind: 'root',
    defaultVisible: true,
    children: MAIN_TRADING_CHILDREN,
  }),

  // Trade header (overlay container)
  def({
    id: SP.TRADE_CONTAINER_HEADER,
    kind: 'panel',
    defaultVisible: true,
    children: TRADE_HEADER_CHILDREN,
  }),

  // Trading station (core overlay root)
  def({
    id: SP.TRADING_STATION_PANEL,
    kind: 'root',
    defaultVisible: true,
    children: TRADING_CHILDREN,
  }),

  // Token selector overlays
  def({ id: SP.BUY_LIST_SELECT_PANEL, kind: 'list' }),
  def({ id: SP.SELL_LIST_SELECT_PANEL, kind: 'list' }),

  // ✅ NEW: first-class list overlays (modeled like Sponsor list panel)
  def({ id: SP.RECIPIENT_LIST_SELECT_PANEL, kind: 'panel' }),
  def({ id: SP.AGENT_LIST_SELECT_PANEL, kind: 'panel' }),

  // ✅ OLD: legacy list overlays (kept during migration)
  def({ id: SP.RECIPIENT_LIST_SELECT_PANEL_OLD, kind: 'list' }),
  def({ id: SP.AGENT_LIST_SELECT_PANEL_OLD, kind: 'list' }),

  def({ id: SP.ERROR_MESSAGE_PANEL, kind: 'panel' }),

  // Manage overlays
  def({
    id: SP.MANAGE_SPONSORSHIPS_PANEL,
    kind: 'panel',
    children: [SP.MANAGE_PENDING_REWARDS],
  }),
  def({ id: SP.MANAGE_PENDING_REWARDS, kind: 'panel' }),

  // Sponsor list select (structural parent) + modes
  def({
    id: SP.SPONSOR_LIST_SELECT_PANEL,
    kind: 'panel',
    children: SPONSOR_LIST_SELECT_CHILDREN,
  }),
  def({ id: SP.UNSPONSOR_SP_COINS, kind: 'panel' }),
  def({ id: SP.CLAIM_PENDING_SPONSOR_COINS, kind: 'panel' }),
  def({ id: SP.CLAIM_PENDING_RECIPIENT_COINS, kind: 'panel' }),
  def({ id: SP.CLAIM_PENDING_AGENT_COINS, kind: 'panel' }),

  // Detail overlays
  def({ id: SP.AGENT_ACCOUNT_PANEL, kind: 'panel' }),
  def({ id: SP.RECIPIENT_ACCOUNT_PANEL, kind: 'panel' }),
  def({ id: SP.SPONSOR_ACCOUNT_PANEL, kind: 'panel' }),

  // Staking/unstaking overlays
  def({ id: SP.UNSTAKING_SPCOINS_PANEL, kind: 'panel' }),
  def({ id: SP.STAKING_SPCOINS_PANEL, kind: 'panel' }),

  // Token contract overlay
  def({ id: SP.TOKEN_CONTRACT_PANEL, kind: 'list' }),

  // Inline / auxiliary
  def({
    id: SP.EXCHANGE_TRADING_PAIR,
    kind: 'panel',
    defaultVisible: true,
    children: EXCHANGE_TRADING_PAIR_CHILDREN,
  }),

  def({
    id: SP.SELL_SELECT_PANEL,
    kind: 'panel',
    defaultVisible: true,
    children: [SP.MANAGE_SPONSORSHIPS_BUTTON],
  }),
  def({
    id: SP.BUY_SELECT_PANEL,
    kind: 'panel',
    defaultVisible: true,
    children: [SP.ADD_SPONSORSHIP_BUTTON],
  }),

  def({
    id: SP.ADD_SPONSORSHIP_PANEL,
    kind: 'panel',
    children: [SP.CONFIG_SPONSORSHIP_PANEL],
  }),
  def({ id: SP.CONFIG_SPONSORSHIP_PANEL, kind: 'panel' }),

  // Config slippage is inline under TRADING_STATION_PANEL
  def({ id: SP.CONFIG_SLIPPAGE_PANEL, kind: 'panel' }),

  // Controls
  def({ id: SP.SWAP_ARROW_BUTTON, kind: 'control', defaultVisible: true }),
  def({ id: SP.CONNECT_TRADE_BUTTON, kind: 'control', defaultVisible: true }),

  // NOTE: you used 'panel' kind here previously; keep it if consumers expect that.
  def({ id: SP.FEE_DISCLOSURE, kind: 'panel', defaultVisible: true }),
  def({ id: SP.AFFILIATE_FEE, kind: 'panel' }),

  // Buttons
  def({ id: SP.ADD_SPONSORSHIP_BUTTON, kind: 'button' }),
  def({ id: SP.MANAGE_SPONSORSHIPS_BUTTON, kind: 'button' }),
] as const;

/* ─────────────────────────────── Derived Helpers ─────────────────────────────── */

export const MAIN_OVERLAY_GROUP: readonly SP[] = MAIN_OVERLAY_GROUP_MODEL;
export const MANAGE_SCOPED: readonly SP[] = MANAGE_SCOPED_MODEL;
export const STACK_COMPONENTS: readonly SP[] = STACK_COMPONENTS_MODEL;

export { IS_MAIN_OVERLAY, IS_MANAGE_SCOPED, IS_STACK_COMPONENT };

export const NON_INDEXED_PANELS = new Set<SP>([
  SP.MAIN_TRADING_PANEL,
  SP.TRADE_CONTAINER_HEADER,
  SP.CONFIG_SLIPPAGE_PANEL,
]);

export const ROOTS: readonly SP[] = [SP.MAIN_TRADING_PANEL] as const;

/** Fast id → definition lookup */
export const PANEL_BY_ID: ReadonlyMap<SP, PanelDef> = (() => {
  const m = new Map<SP, PanelDef>();
  for (const d of PANEL_DEFS) m.set(d.id, d);
  return m;
})();

/** parent → children (from defs that declare children) */
export const CHILDREN: Partial<Record<SP, readonly SP[]>> = (() => {
  const acc: Partial<Record<SP, readonly SP[]>> = {};
  for (const d of PANEL_DEFS) {
    if (d.children?.length) acc[d.id] = d.children;
  }
  return acc;
})();

/** id → kind */
export const KINDS: Partial<Record<SP, PanelKind>> = (() => {
  const acc: Partial<Record<SP, PanelKind>> = {};
  for (const d of PANEL_DEFS) acc[d.id] = d.kind;
  return acc;
})();

/** Dev-only guard: enforce unique ids in PANEL_DEFS */
if (process.env.NODE_ENV !== 'production') {
  const seen = new Set<SP>();
  for (const d of PANEL_DEFS) {
    if (seen.has(d.id)) {
      // eslint-disable-next-line no-console
      console.error('[panelRegistry] Duplicate PANEL_DEFS id:', d.id, d);
      throw new Error(`[panelRegistry] Duplicate PANEL_DEFS id: ${String(d.id)}`);
    }
    seen.add(d.id);
  }
}

export { defaultSpCoinPanelTree } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
