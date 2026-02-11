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
  MAIN_RADIO_OVERLAY_PANELS as MAIN_RADIO_OVERLAY_PANELS_MODEL,
  MANAGE_SCOPED as MANAGE_SCOPED_MODEL,
  STACK_COMPONENTS as STACK_COMPONENTS_MODEL,
  IS_MAIN_RADIO_OVERLAY_PANEL,
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
  SP.FEE_DISCLOSURE,
  SP.AFFILIATE_FEE,
] as const;

/**
 * ACCOUNT_LIST_REWARDS_PANEL children (order matters)
 */
const ACCOUNT_LIST_REWARDS_CHILDREN: readonly SP[] = [
  SP.PENDING_SPONSOR_REWARDS,
  SP.PENDING_RECIPIENT_REWARDS,
  SP.PENDING_AGENT_REWARDS,
  SP.ACTIVE_SPONSORSHIPS,
] as const;

/**
 * ✅ ACCOUNT_PANEL children (order matters)
 */
const ACCOUNT_PANEL_CHILDREN: readonly SP[] = [
  SP.SPONSOR_ACCOUNT,
  SP.RECIPIENT_ACCOUNT,
  SP.AGENT_ACCOUNT,
] as const;

/**
 * ✅ ACCOUNT_LIST_SELECT_PANEL children (order matters)
 */
const ACCOUNT_LIST_SELECT_PANEL_CHILDREN: readonly SP[] = [
  SP.SPONSOR_LIST,
  SP.RECIPIENT_LIST,
  SP.AGENT_LIST,
] as const;

/**
 * ✅ TOKEN_PANEL children (order matters)
 * NOTE: these are NOT stack overlays; they're mode children under the token contract container.
 */
const TOKEN_CONTRACT_PANEL_CHILDREN: readonly SP[] = [
  SP.BUY_CONTRACT,
  SP.SELL_CONTRACT,
  SP.PREVIEW_CONTRACT,
] as const;

/**
 * ✅ TOKEN_LIST_SELECT_PANEL children (order matters)
 */
const TOKEN_LIST_SELECT_PANEL_CHILDREN: readonly SP[] = [SP.BUY_CONTRACT, SP.SELL_CONTRACT] as const;

/**
 * ✅ Tree Panel fix:
 * Each pending/unstake node owns exactly ONE mode child.
 *
 * Since we removed the old mode panels completely, these nodes no longer have
 * synthetic "mode children".
 */
const PENDING_SPONSOR_CHILDREN: readonly SP[] = [] as const;
const PENDING_RECIPIENT_CHILDREN: readonly SP[] = [] as const;
const PENDING_AGENT_CHILDREN: readonly SP[] = [] as const;
const UNSPONSOR_CHILDREN: readonly SP[] = [] as const;

/**
 * Primary overlay container under MAIN_TRADING_PANEL

 */
const TRADE_HEADER_CHILDREN: readonly SP[] = [
  // Core overlay
  SP.TRADING_STATION_PANEL,

  // Token selectors
  SP.TOKEN_LIST_SELECT_PANEL,

  // ✅ Account list selector (new)
  SP.ACCOUNT_LIST_SELECT_PANEL,

  // Errors / hub
  SP.ERROR_MESSAGE_PANEL,

  // ✅ First-class "manage" overlays
  SP.MANAGE_SPONSORSHIPS_PANEL,
  SP.STAKING_SPCOINS_PANEL,

  // Rewards list overlay (parent)
  SP.ACCOUNT_LIST_REWARDS_PANEL,

  // Shared / detail overlays
  SP.ACCOUNT_PANEL,

  // Token contract overlay
  SP.TOKEN_PANEL,
] as const;

const MAIN_TRADING_CHILDREN: readonly SP[] = [SP.TRADE_CONTAINER_HEADER] as const;

/* ─────────────────────────────── Panel Definitions ─────────────────────────────── */

/**
 * Helper to auto-set overlay flag from action-model set.
 */
const def = (d: Omit<PanelDef, 'overlay'>): PanelDef => ({
  ...d,
  ...(IS_MAIN_RADIO_OVERLAY_PANEL.has(Number(d.id)) ? { overlay: true } : null),
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
  def({ id: SP.TOKEN_LIST_SELECT_PANEL, kind: 'list', children: TOKEN_LIST_SELECT_PANEL_CHILDREN }),

  // ✅ Chevron pending controls (used by AccountListRewardsPanel; persistable visibility flags)
  def({ id: SP.CHEVRON_DOWN_OPEN_PENDING, kind: 'control' }),

  // ✅ Account list selector overlay (container)
  def({ id: SP.ACCOUNT_LIST_SELECT_PANEL, kind: 'list', children: ACCOUNT_LIST_SELECT_PANEL_CHILDREN }),

  def({ id: SP.ERROR_MESSAGE_PANEL, kind: 'panel' }),

  // Manage overlays
  def({
    id: SP.MANAGE_SPONSORSHIPS_PANEL,
    kind: 'panel',
    children: [SP.MANAGE_PENDING_REWARDS],
  }),
  def({ id: SP.MANAGE_PENDING_REWARDS, kind: 'panel' }),

  // ✅ Account list rewards (structural parent)
  def({
    id: SP.ACCOUNT_LIST_REWARDS_PANEL,
    kind: 'panel',
    children: ACCOUNT_LIST_REWARDS_CHILDREN,
  }),

  // ✅ Claim panels now have NO synthetic "mode child" panels
  def({
    id: SP.PENDING_SPONSOR_REWARDS,
    kind: 'panel',
    children: PENDING_SPONSOR_CHILDREN,
  }),
  def({
    id: SP.PENDING_RECIPIENT_REWARDS,
    kind: 'panel',
    children: PENDING_RECIPIENT_CHILDREN,
  }),
  def({
    id: SP.PENDING_AGENT_REWARDS,
    kind: 'panel',
    children: PENDING_AGENT_CHILDREN,
  }),

  // ✅ Unstake panel now has no synthetic child panels
  def({
    id: SP.ACTIVE_SPONSORSHIPS,
    kind: 'panel',
    children: UNSPONSOR_CHILDREN,
  }),

  // ✅ ACCOUNT_PANEL state children (active nodes)
  def({ id: SP.SPONSOR_ACCOUNT, kind: 'panel', children: [] }),
  def({ id: SP.RECIPIENT_ACCOUNT, kind: 'panel', children: [] }),
  def({ id: SP.AGENT_ACCOUNT, kind: 'panel', children: [] }),

  // ✅ TOKEN_PANEL mode children
  def({ id: SP.BUY_CONTRACT, kind: 'panel', children: [] }),
  def({ id: SP.SELL_CONTRACT, kind: 'panel', children: [] }),
  def({ id: SP.PREVIEW_CONTRACT, kind: 'panel', children: [] }),

  // ✅ ACCOUNT_LIST_SELECT_PANEL mode children
  def({ id: SP.SPONSOR_LIST, kind: 'list', children: [] }),
  def({ id: SP.RECIPIENT_LIST, kind: 'list', children: [] }),
  def({ id: SP.AGENT_LIST, kind: 'list', children: [] }),

  // Shared / detail overlays
  def({
    id: SP.ACCOUNT_PANEL,
    kind: 'panel',
    children: ACCOUNT_PANEL_CHILDREN,
  }),

  // Staking/unstaking overlays
  def({
    id: SP.STAKING_SPCOINS_PANEL,
    kind: 'panel',
    children: [
      SP.STAKE_TRADING_SPCOINS_PANEL,
      SP.ADD_SPONSORSHIP_PANEL,
      SP.CONNECT_TRADE_BUTTON,
    ],
  }),
  def({ id: SP.STAKE_TRADING_SPCOINS_PANEL, kind: 'panel', children: [] }),

  // Token contract overlay (container)
  // NOTE: This is not a stack overlay. It is a structural parent in the tree.
  def({
    id: SP.TOKEN_PANEL,
    kind: 'panel',
    children: TOKEN_CONTRACT_PANEL_CHILDREN,
  }),

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

export const MAIN_RADIO_OVERLAY_PANELS: readonly SP[] = MAIN_RADIO_OVERLAY_PANELS_MODEL;
export const MANAGE_SCOPED: readonly SP[] = MANAGE_SCOPED_MODEL;
export const STACK_COMPONENTS: readonly SP[] = STACK_COMPONENTS_MODEL;

export { IS_MAIN_RADIO_OVERLAY_PANEL, IS_MANAGE_SCOPED, IS_STACK_COMPONENT };

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
