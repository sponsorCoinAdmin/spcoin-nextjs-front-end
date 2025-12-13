// File: @/lib/structure/exchangeContext/constants/defaultPanelTree.ts

import type {
  SpCoinPanelTree,
  PanelNode,
} from '@/lib/structure/exchangeContext/types/PanelNode';
import { SP_COIN_DISPLAY as SP } from '../enums/spCoinDisplay';

/* ─────────────────────────── helpers ─────────────────────────── */

/**
 * Create a PanelNode with a derived `name` and optional children.
 *
 * - `name` defaults to the SP_COIN_DISPLAY enum label (e.g. "MAIN_TRADING_PANEL").
 * - `children` are only added if the array is non-empty.
 */
const node = (
  panel: SP,
  visible: boolean,
  children?: PanelNode[],
): PanelNode => ({
  panel,
  name: SP[panel] ?? String(panel),
  visible,
  ...(children && children.length ? { children } : {}),
});

/* ──────────────── Single Source of Truth (SSoT) ───────────────── */

/**
 * Panels that should never be persisted in the ExchangeContext
 * `spCoinPanelTree` payload.
 *
 * These panels are expected to be transient (e.g. list overlays that
 * are always reconstructed as needed).
 */
export const NON_PERSISTED_PANELS = new Set<SP>([
  SP.SPONSOR_LIST_SELECT_PANEL,
]);

/**
 * Panels that must always exist in the tree on boot, along with
 * their default visibility.
 *
 * This is used by bootstrapping/migration logic to guarantee that
 * the core trading UI is present, even if older saves are missing
 * some entries.
 */
export const MUST_INCLUDE_ON_BOOT: ReadonlyArray<readonly [SP, boolean]> = [
  [SP.MAIN_TRADING_PANEL, true],
  [SP.TRADE_CONTAINER_HEADER, true],
  [SP.TRADING_STATION_PANEL, true],
  [SP.SELL_SELECT_PANEL, true],
  [SP.BUY_SELECT_PANEL, true],
  [SP.SWAP_ARROW_BUTTON, true],
  [SP.CONNECT_PRICE_BUTTON, true],
  [SP.FEE_DISCLOSURE, true],
  [SP.AFFILIATE_FEE, false],
] as const;

/**
 * defaultSpCoinPanelTree
 *
 * Canonical authored tree for the SponsorCoin UI.
 *
 * This is the *persistable* structure that represents the panel
 * hierarchy for the Exchange page, including:
 *
 * - MAIN_TRADING_PANEL → root for all trading and overlays
 * - TRADING_STATION_PANEL and its inline children
 * - Overlay-style panels (list-select and manage overlays)
 * - Detail views and auxiliary configuration panels
 *
 * Notes:
 * - SPONSOR_LIST_SELECT_PANEL is intentionally excluded from the
 *   tree and handled as NON_PERSISTED.
 * - Visibility flags here represent the "cold start" default.
 */
export const defaultSpCoinPanelTree: SpCoinPanelTree = [
  node(SP.MAIN_TRADING_PANEL, true, [
    // Main trading header (tabs, etc.)
    node(SP.TRADE_CONTAINER_HEADER, true),

    // Core trading station (BUY/SELL selectors plus manage/add buttons)
    node(SP.TRADING_STATION_PANEL, true, [
      node(SP.SELL_SELECT_PANEL, true, [
        node(SP.MANAGE_SPONSORSHIPS_BUTTON, false),
      ]),
      node(SP.BUY_SELECT_PANEL, true, [
        node(SP.ADD_SPONSORSHIP_BUTTON, false),
      ]),
    ]),

    // ─────────────── Radio overlays (top-level siblings) ───────────────
    // These are part of the MAIN_OVERLAY_GROUP and behave like
    // mutually-exclusive overlays in front of the trading station.
    node(SP.BUY_LIST_SELECT_PANEL, false),
    node(SP.SELL_LIST_SELECT_PANEL, false),
    node(SP.RECIPIENT_LIST_SELECT_PANEL, false),
    node(SP.AGENT_LIST_SELECT_PANEL, false),
    node(SP.ERROR_MESSAGE_PANEL, false),

    // ───────────── Manage overlays (top-level entries) ─────────────
    // MANAGE_PENDING_REWARDS is nested under MANAGE_SPONSORSHIPS_PANEL
    // as a "sub-view" within the same overlay.
    node(SP.MANAGE_SPONSORSHIPS_PANEL, false, [
      node(SP.MANAGE_PENDING_REWARDS, false),
    ]),
    node(SP.MANAGE_RECIPIENTS_PANEL, false),
    node(SP.MANAGE_AGENTS_PANEL, false),
    node(SP.CLAIM_SPONSOR_REWARDS_LIST_PANEL, false),

    // ─────────────── Detail views (drill-down pages) ───────────────
    node(SP.MANAGE_AGENT_PANEL, false),
    node(SP.MANAGE_RECIPIENT_PANEL, false),
    node(SP.MANAGE_SPONSOR_PANEL, false),

    // ─────────────── Inline / auxiliary panels ───────────────
    node(SP.ADD_SPONSORSHIP_PANEL, false),
    node(SP.CONFIG_SPONSORSHIP_PANEL, false),

    // ─────────────── Default-on widgets ───────────────
    node(SP.SWAP_ARROW_BUTTON, true),
    node(SP.CONNECT_PRICE_BUTTON, true),
    node(SP.FEE_DISCLOSURE, true),

    // ─────────────── Default-off widget ───────────────
    node(SP.AFFILIATE_FEE, false),
  ]),
];

/* ────────────────────────── utilities ─────────────────────────── */

/**
 * Flat representation of a panel, used for ordering and seeding.
 */
export type FlatPanel = {
  panel: SP;
  name: string;
  visible: boolean;
};

/**
 * Recursively flatten a PanelNode tree into a simple ordered list.
 *
 * The output order is stable and reflects depth-first traversal of
 * the authored tree. This is used as the canonical ordering for
 * MAIN_OVERLAY_GROUP-related logic and boot-time seeding.
 */
export function flattenPanelTree(nodes: PanelNode[]): FlatPanel[] {
  const out: FlatPanel[] = [];

  const walk = (arr: PanelNode[]) => {
    for (const n of arr) {
      out.push({
        panel: n.panel,
        name: n.name ?? SP[n.panel],
        visible: !!n.visible,
      });

      if (n.children?.length) {
        walk(n.children);
      }
    }
  };

  walk(nodes);
  return out;
}

/**
 * DEFAULT_PANEL_ORDER
 *
 * Canonical "panel order" derived from the default tree. This is
 * used when consumers need a stable, enum-based ordering without
 * wiring to the full PanelNode structure.
 */
export const DEFAULT_PANEL_ORDER: readonly SP[] = flattenPanelTree(
  defaultSpCoinPanelTree,
).map((p) => p.panel) as readonly SP[];

/**
 * Seed panels from the default tree, excluding any panels that are
 * explicitly marked as NON_PERSISTED_PANELS.
 *
 * This is typically used to initialize the ExchangeContext
 * `spCoinPanelTree` for a new or migrated user.
 */
export function seedPanelsFromDefault(): FlatPanel[] {
  return flattenPanelTree(defaultSpCoinPanelTree).filter(
    (p) => !NON_PERSISTED_PANELS.has(p.panel),
  );
}
