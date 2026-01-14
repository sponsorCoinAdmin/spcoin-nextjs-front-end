// File: @/lib/structure/exchangeContext/registry/panelRegistry.ts
//
// PURPOSE:
// --------
// Canonical registry for ALL SponsorCoin panels.
// Provides structural metadata only (NO UI logic):
//   • Panel definitions (PANEL_DEFS)
//   • Parent → child relationships
//   • Derived helpers (CHILDREN, KINDS)
//
// NOTE:
// Global overlay membership lists are defined as "action-model groups" in spCoinDisplay.ts
// and imported here to keep a single readable source of truth.
//

import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

// ✅ Action-model groups (explicit membership lists)
import {
  MAIN_OVERLAY_GROUP as MAIN_OVERLAY_GROUP_MODEL,
  MANAGE_SCOPED as MANAGE_SCOPED_MODEL,
  STACK_COMPONENTS as STACK_COMPONENTS_MODEL,
  IS_MAIN_OVERLAY,
  IS_MANAGE_SCOPED,
  IS_STACK_COMPONENT,
} from '@/lib/structure/exchangeContext/constants/spCoinDisplay';

export type PanelKind = 'root' | 'panel' | 'button' | 'list' | 'control';

export type PanelDef = {
  id: SP;
  kind: PanelKind;

  /**
   * If true: participates in the GLOBAL overlay radio group.
   *
   * NOTE: MAIN_OVERLAY_GROUP is now sourced from the action-model list.
   */
  overlay?: boolean;

  /** Cold-start visibility (persisted state may override) */
  defaultVisible?: boolean;

  /** Structural children (tree shape only) */
  children?: SP[];
};

/* ─────────────────────────────── Grouping Helpers ─────────────────────────────── */

/**
 * ✅ EXCHANGE_TRADING_PAIR is a structural container that controls the visibility
 * of the associated div in TradingStationPanel.
 *
 * Tree order requirement:
 *   SELL_SELECT_PANEL
 *     MANAGE_SPONSORSHIPS_BUTTON (child of SELL_SELECT_PANEL)
 *   SWAP_ARROW_BUTTON
 *   BUY_SELECT_PANEL
 */
const EXCHANGE_TRADING_PAIR_CHILDREN: SP[] = [
  SP.SELL_SELECT_PANEL,
  SP.SWAP_ARROW_BUTTON,
  SP.BUY_SELECT_PANEL,
];

/**
 * Trading station children order requirement:
 *   CONFIG_SLIPPAGE_PANEL
 *   EXCHANGE_TRADING_PAIR
 *   ADD_SPONSORSHIP_PANEL
 *   CONNECT_TRADE_BUTTON
 *   FEE_DISCLOSURE
 *   AFFILIATE_FEE
 */
const TRADING_CHILDREN: SP[] = [
  SP.CONFIG_SLIPPAGE_PANEL,
  SP.EXCHANGE_TRADING_PAIR,
  SP.ADD_SPONSORSHIP_PANEL,
  SP.CONNECT_TRADE_BUTTON,
  SP.FEE_DISCLOSURE,
  SP.AFFILIATE_FEE,
];

/**
 * ✅ Sponsor list select panel has sub-modes (future panel control).
 * These are first-class children in the panel tree for visibility/persistence.
 */
const SPONSOR_LIST_SELECT_CHILDREN: SP[] = [
  SP.UNSPONSOR_SP_COINS,
  SP.CLAIM_PENDING_SPONSOR_COINS,
  SP.CLAIM_PENDING_RECIPIENT_COINS,
  SP.CLAIM_PENDING_AGENT_COINS,
];

/**
 * Primary overlay container under MAIN_TRADING_PANEL
 *
 * ✅ Manage panels are first-class overlays mounted here.
 * ✅ EXCEPTION: MANAGE_PENDING_REWARDS is NOT a sibling overlay; it is nested under MANAGE_SPONSORSHIPS_PANEL.
 */
const TRADE_HEADER_CHILDREN: SP[] = [
  SP.TRADING_STATION_PANEL,
  SP.BUY_LIST_SELECT_PANEL,
  SP.SELL_LIST_SELECT_PANEL,
  SP.RECIPIENT_LIST_SELECT_PANEL,
  SP.AGENT_LIST_SELECT_PANEL,
  SP.ERROR_MESSAGE_PANEL,

  // ✅ First-class "manage" overlays
  SP.MANAGE_SPONSORSHIPS_PANEL,
  // ❌ SP.MANAGE_PENDING_REWARDS,  // moved under MANAGE_SPONSORSHIPS_PANEL
  SP.UNSTAKING_SPCOINS_PANEL,
  SP.STAKING_SPCOINS_PANEL,
  SP.MANAGE_RECIPIENTS_PANEL,
  SP.MANAGE_AGENTS_PANEL,
  SP.SPONSOR_LIST_SELECT_PANEL,
  SP.MANAGE_AGENT_PANEL,
  SP.MANAGE_RECIPIENT_PANEL,

  // ✅ Shared detail panel should live at the same level as other overlays (not nested)
  SP.MANAGE_SPONSOR_PANEL,

  // Overlay list (not persisted)
  SP.SPONSOR_LIST_SELECT_PANEL_OLD,
];

const MAIN_TRADING_CHILDREN: SP[] = [SP.TRADE_CONTAINER_HEADER];

/* ─────────────────────────────── PANEL DEFINITIONS ─────────────────────────────── */

export const PANEL_DEFS: readonly PanelDef[] = [
  /* Root */
  {
    id: SP.MAIN_TRADING_PANEL,
    kind: 'root',
    defaultVisible: true,
    children: MAIN_TRADING_CHILDREN,
  },

  /* Trade header (overlay container) */
  {
    id: SP.TRADE_CONTAINER_HEADER,
    kind: 'panel',
    defaultVisible: true,
    children: TRADE_HEADER_CHILDREN,
  },

  /* Global overlays */
  {
    id: SP.TRADING_STATION_PANEL,
    kind: 'root',
    overlay: true,
    defaultVisible: true,
    children: TRADING_CHILDREN,
  },

  { id: SP.BUY_LIST_SELECT_PANEL, kind: 'list', overlay: true },
  { id: SP.SELL_LIST_SELECT_PANEL, kind: 'list', overlay: true },
  { id: SP.RECIPIENT_LIST_SELECT_PANEL, kind: 'list', overlay: true },
  { id: SP.AGENT_LIST_SELECT_PANEL, kind: 'list', overlay: true },
  { id: SP.ERROR_MESSAGE_PANEL, kind: 'panel', overlay: true },

  /* First-class overlay panels */
  {
    id: SP.MANAGE_SPONSORSHIPS_PANEL,
    kind: 'panel',
    // ✅ Pending Rewards is a nested sub-container within Manage Sponsorships
    children: [SP.MANAGE_PENDING_REWARDS],
  },
  { id: SP.MANAGE_PENDING_REWARDS, kind: 'panel' },

  { id: SP.MANAGE_RECIPIENTS_PANEL, kind: 'panel' },
  { id: SP.MANAGE_AGENTS_PANEL, kind: 'panel' },

  /**
   * Sponsor list select (structural parent).
   * Child "modes" are first-class tree nodes for future control + persistence.
   */
  {
    id: SP.SPONSOR_LIST_SELECT_PANEL,
    kind: 'panel',
    children: SPONSOR_LIST_SELECT_CHILDREN,
  },

  // ✅ Sponsor list select sub-panels (future control; visible in tree)
  { id: SP.UNSPONSOR_SP_COINS, kind: 'panel' },
  { id: SP.CLAIM_PENDING_SPONSOR_COINS, kind: 'panel' },
  { id: SP.CLAIM_PENDING_RECIPIENT_COINS, kind: 'panel' },
  { id: SP.CLAIM_PENDING_AGENT_COINS, kind: 'panel' },

  { id: SP.MANAGE_AGENT_PANEL, kind: 'panel' },
  { id: SP.MANAGE_RECIPIENT_PANEL, kind: 'panel' },

  /**
   * Unstaking (no longer nests sponsor detail structurally)
   * Navigation to sponsor detail is handled by action model, not registry nesting.
   */
  {
    id: SP.UNSTAKING_SPCOINS_PANEL,
    kind: 'panel',
  },

  { id: SP.STAKING_SPCOINS_PANEL, kind: 'panel' },

  /**
   * Shared detail panel (mounted once at overlay level)
   */
  { id: SP.MANAGE_SPONSOR_PANEL, kind: 'panel' },

  /* Sponsor list (GLOBAL overlay, not persisted) */
  { id: SP.SPONSOR_LIST_SELECT_PANEL_OLD, kind: 'list', overlay: true },

  /* Inline / auxiliary */

  /**
   * ✅ Container controlling the TRADING_PAIR/EXCHANGE_TRADING_PAIR visibility.
   */
  {
    id: SP.EXCHANGE_TRADING_PAIR,
    kind: 'panel',
    defaultVisible: true,
    children: EXCHANGE_TRADING_PAIR_CHILDREN,
  },

  {
    id: SP.SELL_SELECT_PANEL,
    kind: 'panel',
    defaultVisible: true,
    children: [SP.MANAGE_SPONSORSHIPS_BUTTON],
  },
  {
    id: SP.BUY_SELECT_PANEL,
    kind: 'panel',
    defaultVisible: true,
    children: [SP.ADD_SPONSORSHIP_BUTTON],
  },

  {
    id: SP.ADD_SPONSORSHIP_PANEL,
    kind: 'panel',
    children: [SP.CONFIG_SPONSORSHIP_PANEL],
  },

  { id: SP.CONFIG_SPONSORSHIP_PANEL, kind: 'panel' },

  /**
   * ✅ Config Slippage is an inline panel under TRADING_STATION_PANEL
   * (NOT under TRADE_CONTAINER_HEADER).
   */
  { id: SP.CONFIG_SLIPPAGE_PANEL, kind: 'panel' },

  /* Controls */
  { id: SP.SWAP_ARROW_BUTTON, kind: 'control', defaultVisible: true },
  { id: SP.CONNECT_TRADE_BUTTON, kind: 'control', defaultVisible: true },
  { id: SP.FEE_DISCLOSURE, kind: 'panel', defaultVisible: true },
  { id: SP.AFFILIATE_FEE, kind: 'panel' },

  /* Buttons */
  { id: SP.ADD_SPONSORSHIP_BUTTON, kind: 'button' },
  { id: SP.MANAGE_SPONSORSHIPS_BUTTON, kind: 'button' },
] as const;

/* ─────────────────────────────── Derived Helpers ─────────────────────────────── */

export const MAIN_OVERLAY_GROUP: readonly SP[] =
  MAIN_OVERLAY_GROUP_MODEL as readonly SP[];

export const MANAGE_SCOPED: readonly SP[] = MANAGE_SCOPED_MODEL as readonly SP[];
export const STACK_COMPONENTS: readonly SP[] =
  STACK_COMPONENTS_MODEL as readonly SP[];

export { IS_MAIN_OVERLAY, IS_MANAGE_SCOPED, IS_STACK_COMPONENT };

export const NON_INDEXED_PANELS = new Set<SP>([
  SP.MAIN_TRADING_PANEL,
  SP.TRADE_CONTAINER_HEADER,
  SP.CONFIG_SLIPPAGE_PANEL,
]);

export const ROOTS: SP[] = [SP.MAIN_TRADING_PANEL];

export const CHILDREN: Partial<Record<SP, SP[]>> = PANEL_DEFS.reduce(
  (acc, d) => {
    if (d.children?.length) acc[d.id] = d.children;
    return acc;
  },
  {} as Partial<Record<SP, SP[]>>,
);

export const KINDS: Partial<Record<SP, PanelKind>> = PANEL_DEFS.reduce(
  (acc, d) => {
    acc[d.id] = d.kind;
    return acc;
  },
  {} as Partial<Record<SP, PanelKind>>,
);

export { defaultSpCoinPanelTree } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
