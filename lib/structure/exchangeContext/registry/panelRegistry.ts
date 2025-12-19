// File: @/lib/structure/exchangeContext/registry/panelRegistry.ts
//
// PURPOSE:
// --------
// Canonical registry for ALL SponsorCoin panels.
// Provides structural metadata only (NO UI logic):
//   • Panel definitions (PANEL_DEFS)
//   • Overlay participation
//   • Parent → child relationships
//   • Derived helpers (MAIN_OVERLAY_GROUP, CHILDREN, KINDS)
//
// This registry drives:
//   - usePanelTree()
//   - useOverlayCloseHandler()
//   - PanelTree persistence & reconciliation
//

import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

export type PanelKind = 'root' | 'panel' | 'button' | 'list' | 'control';

export type PanelDef = {
  id: SP;
  kind: PanelKind;

  /**
   * If true: participates in the GLOBAL overlay radio group.
   * Scoped (nested) radio behavior is handled in usePanelTree via CHILDREN.
   */
  overlay?: boolean;

  /** Cold-start visibility (persisted state may override) */
  defaultVisible?: boolean;

  /** Structural children (tree shape only) */
  children?: SP[];
};

/* ─────────────────────────────── Grouping Helpers ─────────────────────────────── */

const TRADING_CHILDREN: SP[] = [
  SP.SELL_SELECT_PANEL,
  SP.BUY_SELECT_PANEL,
  SP.ADD_SPONSORSHIP_PANEL,
  SP.SWAP_ARROW_BUTTON,
  SP.CONNECT_PRICE_BUTTON,
  SP.FEE_DISCLOSURE,
  SP.AFFILIATE_FEE,
  SP.CONFIG_SLIPPAGE_PANEL,
];

/**
 * Nested Manage Sponsorships container (GLOBAL overlay)
 *
 * NOTE:
 * MANAGE_SPONSOR_PANEL is intentionally NOT a direct child here.
 * It is nested under multiple parents:
 *   - CLAIM_SPONSOR_REWARDS_LIST_PANEL
 *   - UNSTAKING_SPCOINS_PANEL
 */
const MANAGE_SPONSORSHIPS_CHILDREN: SP[] = [
  SP.MANAGE_SPONSORSHIPS_PANEL,
  SP.UNSTAKING_SPCOINS_PANEL,
  SP.STAKING_SPCOINS_PANEL,
  SP.MANAGE_RECIPIENTS_PANEL,
  SP.MANAGE_AGENTS_PANEL,
  SP.CLAIM_SPONSOR_REWARDS_LIST_PANEL,
  SP.MANAGE_AGENT_PANEL,
  SP.MANAGE_RECIPIENT_PANEL,
  // SP.MANAGE_SPONSOR_PANEL, // ⛔ moved under two specific parents
];

/**
 * Primary overlay container under MAIN_TRADING_PANEL
 */
const TRADE_HEADER_CHILDREN: SP[] = [
  SP.TRADING_STATION_PANEL,
  SP.BUY_LIST_SELECT_PANEL,
  SP.SELL_LIST_SELECT_PANEL,
  SP.RECIPIENT_LIST_SELECT_PANEL,
  SP.AGENT_LIST_SELECT_PANEL,
  SP.ERROR_MESSAGE_PANEL,
  SP.MANAGE_SPONSORSHIPS,
  SP.SPONSOR_LIST_SELECT_PANEL,
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

  /* Manage Sponsorships (GLOBAL overlay container) */
  {
    id: SP.MANAGE_SPONSORSHIPS,
    kind: 'root',
    overlay: true,
    children: MANAGE_SPONSORSHIPS_CHILDREN,
  },

  /* Scoped children under MANAGE_SPONSORSHIPS */
  {
    id: SP.MANAGE_SPONSORSHIPS_PANEL,
    kind: 'panel',
    children: [SP.MANAGE_PENDING_REWARDS],
  },

  { id: SP.MANAGE_RECIPIENTS_PANEL, kind: 'panel' },
  { id: SP.MANAGE_AGENTS_PANEL, kind: 'panel' },

  /**
   * Parent #1: Claim Rewards list can drill into Sponsor detail
   */
  {
    id: SP.CLAIM_SPONSOR_REWARDS_LIST_PANEL,
    kind: 'panel',
    children: [SP.MANAGE_SPONSOR_PANEL],
  },

  { id: SP.MANAGE_AGENT_PANEL, kind: 'panel' },
  { id: SP.MANAGE_RECIPIENT_PANEL, kind: 'panel' },

  /**
   * Parent #2: Unstaking can drill into Sponsor detail
   */
  {
    id: SP.UNSTAKING_SPCOINS_PANEL,
    kind: 'panel',
    children: [SP.MANAGE_SPONSOR_PANEL],
  },

  { id: SP.STAKING_SPCOINS_PANEL, kind: 'panel' },

  /**
   * Shared detail panel (scoped)
   *
   * NOTE:
   * This panel is referenced as a child under multiple parents above.
   */
  { id: SP.MANAGE_SPONSOR_PANEL, kind: 'panel' },

  /* Non-overlay substate */
  { id: SP.MANAGE_PENDING_REWARDS, kind: 'panel' },

  /* Sponsor list (GLOBAL overlay, not persisted) */
  { id: SP.SPONSOR_LIST_SELECT_PANEL, kind: 'list', overlay: true },

  /* Inline / auxiliary */
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
  { id: SP.CONFIG_SLIPPAGE_PANEL, kind: 'panel' },

  /* Controls */
  { id: SP.SWAP_ARROW_BUTTON, kind: 'control', defaultVisible: true },
  { id: SP.CONNECT_PRICE_BUTTON, kind: 'control', defaultVisible: true },
  { id: SP.FEE_DISCLOSURE, kind: 'panel', defaultVisible: true },
  { id: SP.AFFILIATE_FEE, kind: 'panel' },

  /* Buttons */
  { id: SP.ADD_SPONSORSHIP_BUTTON, kind: 'button' },
  { id: SP.MANAGE_SPONSORSHIPS_BUTTON, kind: 'button' },
] as const;

/* ─────────────────────────────── Derived Helpers ─────────────────────────────── */

export const MAIN_OVERLAY_GROUP: readonly SP[] =
  PANEL_DEFS.filter((d) => !!d.overlay).map((d) => d.id) as readonly SP[];

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
