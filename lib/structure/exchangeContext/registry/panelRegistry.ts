// File: @/lib/structure/exchangeContext/registry/panelRegistry.ts
//
// PURPOSE:
// --------
// This file defines the canonical registry for ALL SponsorCoin panels.
// It provides:
//   • Panel definitions               (PANEL_DEFS)
//   • Categorization metadata         (kind, overlay, children, defaultVisible)
//   • Discovery groups                (MAIN_OVERLAY_GROUP, ROOTS, CHILDREN, KINDS)
//   • A stable source of truth for the PanelTree engine.
//
// IMPORTANT:
// ----------
// This registry drives runtime behavior in:
//   - usePanelTree()
//   - useOverlayCloseHandler()
//   - PanelTree persistence
//   - Overlay radio-group behavior
//
// Nothing in this file should contain UI logic — only structural metadata.
//

import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

export type PanelKind = 'root' | 'panel' | 'button' | 'list' | 'control';

type PanelDef = {
  id: SP;
  kind: PanelKind;

  /**
   * If true: this panel participates in *GLOBAL* overlay selection.
   * NOTE: Scoped (nested) radio-groups are handled by usePanelTree via CHILDREN.
   */
  overlay?: boolean;

  /** Cold-start visibility (persisted state may override) */
  defaultVisible?: boolean;

  /** Structural associations / inlined actions */
  children?: SP[];
};

/* ─────────────────────────────── Grouping Helpers ───────────────────────────────
   These arrays exist strictly for readability and maintainability.
   They are *not* used directly by usePanelTree — PANEL_DEFS is the truth.
---------------------------------------------------------------------------------- */

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
 * ✅ Nested "Manage Sponsorships" overlay container.
 *
 * Desired tree shape:
 *   TRADE_CONTAINER_HEADER
 *     → MANAGE_SPONSORSHIPS (GLOBAL overlay container)
 *         → MANAGE_SPONSORSHIPS_PANEL (scoped child; has child MANAGE_PENDING_REWARDS)
 *         → UNSTAKING_SPCOINS_PANEL
 *         → STAKING_SPCOINS_PANEL
 *         → MANAGE_RECIPIENTS_PANEL
 *         → MANAGE_AGENTS_PANEL
 *         → CLAIM_SPONSOR_REWARDS_LIST_PANEL
 *         → MANAGE_AGENT_PANEL
 *         → MANAGE_RECIPIENT_PANEL
 *         → MANAGE_SPONSOR_PANEL
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
  SP.MANAGE_SPONSOR_PANEL,
];

/**
 * ✅ TRADE_CONTAINER_HEADER children
 *
 * This is the primary overlay container under MAIN_TRADING_PANEL.
 * Your tree visualizer expects overlays to live under TRADE_CONTAINER_HEADER.
 */
const TRADE_HEADER_CHILDREN: SP[] = [
  // Core trading overlay
  SP.TRADING_STATION_PANEL,

  // List overlays (GLOBAL radio-group overlays)
  SP.BUY_LIST_SELECT_PANEL,
  SP.SELL_LIST_SELECT_PANEL,
  SP.RECIPIENT_LIST_SELECT_PANEL,
  SP.AGENT_LIST_SELECT_PANEL,
  SP.ERROR_MESSAGE_PANEL,

  // ✅ Manage Sponsorships container (GLOBAL radio-group overlay)
  SP.MANAGE_SPONSORSHIPS,
];

/**
 * Main trading container children.
 * NOTE: Overlays are now nested under TRADE_CONTAINER_HEADER.
 */
const MAIN_TRADING_CHILDREN: SP[] = [SP.TRADE_CONTAINER_HEADER];

/* ─────────────────────────────── PANEL DEFINITIONS ───────────────────────────────
   PANEL_DEFS is the *canonical source of truth* describing every panel.
---------------------------------------------------------------------------------- */

export const PANEL_DEFS: readonly PanelDef[] = [
  /* ───────────── ROOT: MAIN TRADING UI ───────────── */
  {
    id: SP.MAIN_TRADING_PANEL,
    kind: 'root',
    defaultVisible: true,
    children: MAIN_TRADING_CHILDREN,
  },

  /* ───────────── TRADE HEADER: primary overlay container ───────────── */
  {
    id: SP.TRADE_CONTAINER_HEADER,
    kind: 'panel',
    defaultVisible: true,
    children: TRADE_HEADER_CHILDREN,
  },

  /* ───────────── TRADING STATION (GLOBAL overlay) ───────────── */
  {
    id: SP.TRADING_STATION_PANEL,
    kind: 'root',
    overlay: true,
    defaultVisible: true,
    children: TRADING_CHILDREN,
  },

  /* ───────────── List-select overlays (GLOBAL overlays) ───────────── */
  { id: SP.BUY_LIST_SELECT_PANEL, kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.SELL_LIST_SELECT_PANEL, kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.RECIPIENT_LIST_SELECT_PANEL, kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.AGENT_LIST_SELECT_PANEL, kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.ERROR_MESSAGE_PANEL, kind: 'panel', overlay: true, defaultVisible: false },

  /* ───────────── ✅ Manage Sponsorships container (GLOBAL overlay) ───────────── */
  {
    id: SP.MANAGE_SPONSORSHIPS,
    kind: 'root',
    overlay: true, // ✅ stays in MAIN_OVERLAY_GROUP
    defaultVisible: false,
    children: MANAGE_SPONSORSHIPS_CHILDREN,
  },

  /* ───────────── Manage Sponsorships: scoped children (NOT global overlays) ───────────── */
  {
    id: SP.MANAGE_SPONSORSHIPS_PANEL,
    kind: 'panel',
    overlay: false, // ✅ IMPORTANT: scoped under MANAGE_SPONSORSHIPS (NOT global radio)
    defaultVisible: false,
    children: [SP.MANAGE_PENDING_REWARDS],
  },

  { id: SP.MANAGE_RECIPIENTS_PANEL, kind: 'panel', overlay: false, defaultVisible: false },
  { id: SP.MANAGE_AGENTS_PANEL, kind: 'panel', overlay: false, defaultVisible: false },
  { id: SP.CLAIM_SPONSOR_REWARDS_LIST_PANEL, kind: 'panel', overlay: false, defaultVisible: false },

  { id: SP.MANAGE_AGENT_PANEL, kind: 'panel', overlay: false, defaultVisible: false },
  { id: SP.MANAGE_RECIPIENT_PANEL, kind: 'panel', overlay: false, defaultVisible: false },
  { id: SP.MANAGE_SPONSOR_PANEL, kind: 'panel', overlay: false, defaultVisible: false },

  /* ───────────── Non-overlay substate (special case) ───────────── */
  {
    id: SP.MANAGE_PENDING_REWARDS,
    kind: 'panel',
    overlay: false,
    defaultVisible: false,
  },

  /* ───────────── SP Coin management (scoped under MANAGE_SPONSORSHIPS) ───────────── */
  { id: SP.UNSTAKING_SPCOINS_PANEL, kind: 'panel', overlay: false, defaultVisible: false },
  { id: SP.STAKING_SPCOINS_PANEL, kind: 'panel', overlay: false, defaultVisible: false },

  /* ───────────── Sponsor list (NOT persisted, but still a GLOBAL overlay) ───────────── */
  { id: SP.SPONSOR_LIST_SELECT_PANEL, kind: 'list', overlay: true, defaultVisible: false },

  /* ───────────── Inline / auxiliary panels ───────────── */
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
    defaultVisible: false,
    children: [SP.CONFIG_SPONSORSHIP_PANEL],
  },
  { id: SP.CONFIG_SPONSORSHIP_PANEL, kind: 'panel', defaultVisible: false },
  { id: SP.CONFIG_SLIPPAGE_PANEL, kind: 'panel', defaultVisible: false },

  /* ───────────── Controls & UI widgets ───────────── */
  { id: SP.SWAP_ARROW_BUTTON, kind: 'control', defaultVisible: true },
  { id: SP.CONNECT_PRICE_BUTTON, kind: 'control', defaultVisible: true },
  { id: SP.FEE_DISCLOSURE, kind: 'panel', defaultVisible: true },
  { id: SP.AFFILIATE_FEE, kind: 'panel', defaultVisible: false },

  /* ───────────── Buttons ───────────── */
  { id: SP.ADD_SPONSORSHIP_BUTTON, kind: 'button', defaultVisible: false },
  { id: SP.MANAGE_SPONSORSHIPS_BUTTON, kind: 'button', defaultVisible: false },
] as const;

/* ─────────────────────────────── MAIN_OVERLAY_GROUP ───────────────────────────────
   Global radio group only.
   Scoped groups (e.g. MANAGE_SPONSORSHIPS children) are handled in usePanelTree.
------------------------------------------------------------------------------------ */
export const MAIN_OVERLAY_GROUP: readonly SP[] =
  PANEL_DEFS.filter((d) => d.overlay === true).map((d) => d.id) as readonly SP[];

/* ─────────────────────────────── Non-indexed panels ─────────────────────────────── */
export const NON_INDEXED_PANELS = new Set<SP>([
  SP.MAIN_TRADING_PANEL,
  SP.TRADE_CONTAINER_HEADER,
  SP.CONFIG_SLIPPAGE_PANEL,
]);

/* ─────────────────────────────── Roots & Children ─────────────────────────────── */

export const ROOTS: SP[] = [SP.MAIN_TRADING_PANEL];

/**
 * CHILDREN:
 * A map of `panel -> child panels`, derived from PANEL_DEFS.
 */
export const CHILDREN: Partial<Record<SP, SP[]>> = PANEL_DEFS.reduce(
  (acc, d) => {
    if (Array.isArray(d.children) && d.children.length > 0) {
      acc[d.id] = d.children as SP[];
    }
    return acc;
  },
  {} as Partial<Record<SP, SP[]>>,
);

/**
 * KINDS:
 * A simple fast-lookup map for panel kind.
 */
export const KINDS: Partial<Record<SP, PanelKind>> = PANEL_DEFS.reduce(
  (acc, d) => {
    acc[d.id] = d.kind;
    return acc;
  },
  {} as Partial<Record<SP, PanelKind>>,
);

/* ─────────────────────────────── Default Tree Re-export ─────────────────────────────── */

export { defaultSpCoinPanelTree } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
