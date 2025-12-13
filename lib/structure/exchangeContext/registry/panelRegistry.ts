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
  overlay?: boolean;        // If true → participates in MAIN_OVERLAY_GROUP radio behavior
  defaultVisible?: boolean; // Cold-start visibility (persisted state may override)
  children?: SP[];          // Structural associations / inlined actions
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

const MAIN_TRADING_CHILDREN: SP[] = [
  SP.TRADE_CONTAINER_HEADER,
  SP.TRADING_STATION_PANEL,

  // List overlays (radio-group overlays)
  SP.BUY_LIST_SELECT_PANEL,
  SP.SELL_LIST_SELECT_PANEL,
  SP.RECIPIENT_LIST_SELECT_PANEL,
  SP.AGENT_LIST_SELECT_PANEL,
  SP.ERROR_MESSAGE_PANEL,

  // Manage overlays (radio-group overlays)
  SP.MANAGE_SPONSORSHIPS_PANEL,
  SP.MANAGE_RECIPIENTS_PANEL,
  SP.MANAGE_AGENTS_PANEL,
  SP.MANAGE_SPONSORS_PANEL,

  // Detail views (still overlays)
  SP.MANAGE_AGENT_PANEL,
  SP.MANAGE_RECIPIENT_PANEL,
  SP.MANAGE_SPONSOR_PANEL,

  // New SP Coin management overlays
  SP.UNSTAKING_SPCOINS_PANEL,
  SP.STAKING_SPCOINS_PANEL,
];

/* ─────────────────────────────── PANEL DEFINITIONS ───────────────────────────────
   PANEL_DEFS is the *canonical source of truth* describing every panel.
   It is consumed by:
     - usePanelTree()
     - Overlay close handler
     - Default tree seeding
     - Panel debugging tools

   NEVER mutate PANEL_DEFS dynamically — treat it as static configuration.
---------------------------------------------------------------------------------- */

export const PANEL_DEFS: readonly PanelDef[] = [
  /* ───────────── ROOT: MAIN TRADING UI ───────────── */
  {
    id: SP.MAIN_TRADING_PANEL,
    kind: 'root',
    defaultVisible: true,
    children: MAIN_TRADING_CHILDREN,
  },

  { id: SP.TRADE_CONTAINER_HEADER, kind: 'panel', defaultVisible: true },

  /* ───────────── ROOT: TRADING STATION ───────────── */
  {
    id: SP.TRADING_STATION_PANEL,
    kind: 'root',
    overlay: true,     // Appears in MAIN_OVERLAY_GROUP
    defaultVisible: true,
    children: TRADING_CHILDREN,
  },

  /* ───────────── List-select overlays ───────────── */
  { id: SP.BUY_LIST_SELECT_PANEL,       kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.SELL_LIST_SELECT_PANEL,      kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.RECIPIENT_LIST_SELECT_PANEL, kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.AGENT_LIST_SELECT_PANEL,     kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.ERROR_MESSAGE_PANEL,         kind: 'panel', overlay: true, defaultVisible: false },

  /* ───────────── Manage overlays (radio-group peers) ───────────── */
  {
    id: SP.MANAGE_SPONSORSHIPS_PANEL,
    kind: 'panel',
    overlay: true,
    defaultVisible: false,
    children: [SP.MANAGE_PENDING_REWARDS], // NOT an overlay
  },
  { id: SP.MANAGE_RECIPIENTS_PANEL, kind: 'panel', overlay: true, defaultVisible: false },
  { id: SP.MANAGE_AGENTS_PANEL,     kind: 'panel', overlay: true, defaultVisible: false },
  { id: SP.MANAGE_SPONSORS_PANEL,   kind: 'panel', overlay: true, defaultVisible: false },

  /* ───────────── Detail overlays ───────────── */
  { id: SP.MANAGE_AGENT_PANEL,     kind: 'panel', overlay: true, defaultVisible: false },
  { id: SP.MANAGE_RECIPIENT_PANEL, kind: 'panel', overlay: true, defaultVisible: false },
  { id: SP.MANAGE_SPONSOR_PANEL,   kind: 'panel', overlay: true, defaultVisible: false },

  /* ───────────── Non-overlay substate (special case) ─────────────
     MANAGE_PENDING_REWARDS is intentionally *not* an overlay.
     It behaves like a child "mode" inside MANAGE_SPONSORSHIPS_PANEL.
  ------------------------------------------------------------------ */
  {
    id: SP.MANAGE_PENDING_REWARDS,
    kind: 'panel',
    defaultVisible: false,
  },

  /* ───────────── SP Coin management ───────────── */
  {
    id: SP.UNSTAKING_SPCOINS_PANEL,
    kind: 'panel',
    overlay: true,
    defaultVisible: false,
  },
  {
    id: SP.STAKING_SPCOINS_PANEL,
    kind: 'panel',
    overlay: true,
    defaultVisible: false,
  },

  /* ───────────── Sponsor list (NOT persisted, but still defined) ───────────── */
  {
    id: SP.SPONSOR_LIST_SELECT_PANEL,
    kind: 'list',
    overlay: true,
    defaultVisible: false,
  },

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
  { id: SP.CONFIG_SLIPPAGE_PANEL,    kind: 'panel', defaultVisible: false },

  /* ───────────── Controls & UI widgets ───────────── */
  { id: SP.SWAP_ARROW_BUTTON,    kind: 'control', defaultVisible: true },
  { id: SP.CONNECT_PRICE_BUTTON, kind: 'control', defaultVisible: true },
  { id: SP.FEE_DISCLOSURE,       kind: 'panel',   defaultVisible: true },
  { id: SP.AFFILIATE_FEE,        kind: 'panel',   defaultVisible: false },

  /* ───────────── Buttons ───────────── */
  { id: SP.ADD_SPONSORSHIP_BUTTON,     kind: 'button', defaultVisible: false },
  { id: SP.MANAGE_SPONSORSHIPS_BUTTON, kind: 'button', defaultVisible: false },
] as const;

/* ─────────────────────────────── MAIN_OVERLAY_GROUP ───────────────────────────────
   All overlay === true panels participate in overlay radio behavior.
   MANAGE_PENDING_REWARDS is intentionally excluded.
------------------------------------------------------------------------------------ */
export const MAIN_OVERLAY_GROUP: readonly SP[] =
  PANEL_DEFS.filter((d) => d.overlay === true).map((d) => d.id) as readonly SP[];

/* ─────────────────────────────── Non-indexed panels ───────────────────────────────
   Used by various systems that cannot index certain panels.
------------------------------------------------------------------------------------ */
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
    if (Array.isArray(d.children) && d.children.length > 0)
      acc[d.id] = d.children as SP[];
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
