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
export const NON_PERSISTED_PANELS = new Set<SP>([SP.SPONSOR_LIST_SELECT_PANEL_OLD]);

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
  [SP.CONNECT_TRADE_BUTTON, true],
  [SP.FEE_DISCLOSURE, true],
  [SP.AFFILIATE_FEE, false],

  // ✅ Manage panels are first-class overlays; ensure the landing panel exists.
  [SP.MANAGE_SPONSORSHIPS_PANEL, false],
] as const;

/**
 * defaultSpCoinPanelTree
 *
 * Canonical authored tree for the SponsorCoin UI.
 *
 * Notes:
 * - SP.SPONSOR_LIST_SELECT_PANEL_OLD is intentionally excluded from the
 *   tree and handled as NON_PERSISTED.
 * - Visibility flags here represent the "cold start" default.
 *
 * IMPORTANT:
 * - MANAGE_PENDING_REWARDS is nested under MANAGE_SPONSORSHIPS_PANEL (not a sibling overlay).
 * - SPONSOR_LIST_SELECT_PANEL has sub-panels (future control).
 * - MANAGE_SPONSOR_PANEL is mounted once at the overlay level (not nested structurally).
 */
export const defaultSpCoinPanelTree: SpCoinPanelTree = [
  node(SP.MAIN_TRADING_PANEL, true, [
    // Trade container header is the overlay container in the tree
    node(SP.TRADE_CONTAINER_HEADER, true, [
      // Trading station (always-on core)
      node(SP.TRADING_STATION_PANEL, true, [
        node(SP.SELL_SELECT_PANEL, true, [node(SP.MANAGE_SPONSORSHIPS_BUTTON, false)]),
        node(SP.BUY_SELECT_PANEL, true, [node(SP.ADD_SPONSORSHIP_BUTTON, false)]),
      ]),

      // ─────────────── Radio overlays (siblings under TRADE_CONTAINER_HEADER) ───────────────
      node(SP.BUY_LIST_SELECT_PANEL, false),
      node(SP.SELL_LIST_SELECT_PANEL, false),
      node(SP.RECIPIENT_LIST_SELECT_PANEL, false),
      node(SP.AGENT_LIST_SELECT_PANEL, false),
      node(SP.ERROR_MESSAGE_PANEL, false),

      // ─────────────── ✅ Manage overlays as first-class main overlays ───────────────
      node(SP.MANAGE_SPONSORSHIPS_PANEL, false, [
        // ✅ Nested within Manage Sponsorships (sub-container)
        node(SP.MANAGE_PENDING_REWARDS, false),
      ]),

      node(SP.UNSTAKING_SPCOINS_PANEL, false),
      node(SP.STAKING_SPCOINS_PANEL, false),
      node(SP.MANAGE_RECIPIENTS_PANEL, false),
      node(SP.MANAGE_AGENTS_PANEL, false),

      // Sponsor list select (parent) + sub-panels (future control)
      node(SP.SPONSOR_LIST_SELECT_PANEL, false, [
        node(SP.UNSPONSOR_SP_COINS, false),
        node(SP.CLAIM_PENDING_SPONSOR_COINS, false),
        node(SP.CLAIM_PENDING_RECIPIENT_COINS, false),
        node(SP.CLAIM_PENDING_AGENT_COINS, false),
      ]),


      // Detail views (also overlays in the same group)
      node(SP.MANAGE_AGENT_PANEL, false),
      node(SP.MANAGE_RECIPIENT_PANEL, false),

      // ✅ Shared detail panel (mounted once at overlay level)
      node(SP.MANAGE_SPONSOR_PANEL, false),

      // ─────────────── Inline / auxiliary panels ───────────────
      node(SP.ADD_SPONSORSHIP_PANEL, false),
      node(SP.CONFIG_SPONSORSHIP_PANEL, false),

      // ─────────────── Default-on widgets ───────────────
      node(SP.SWAP_ARROW_BUTTON, true),
      node(SP.CONNECT_TRADE_BUTTON, true),
      node(SP.FEE_DISCLOSURE, true),

      // ─────────────── Default-off widget ───────────────
      node(SP.AFFILIATE_FEE, false),
    ]),
  ]),
];

/* ────────────────────────── utilities ─────────────────────────── */

export type FlatPanel = {
  panel: SP;
  name: string;
  visible: boolean;
};

export function flattenPanelTree(nodes: PanelNode[]): FlatPanel[] {
  const out: FlatPanel[] = [];

  const walk = (arr: PanelNode[]) => {
    for (const n of arr) {
      out.push({
        panel: n.panel,
        name: n.name ?? SP[n.panel],
        visible: !!n.visible,
      });

      if (n.children?.length) walk(n.children);
    }
  };

  walk(nodes);
  return out;
}

export const DEFAULT_PANEL_ORDER: readonly SP[] = flattenPanelTree(
  defaultSpCoinPanelTree,
).map((p) => p.panel) as readonly SP[];

export function seedPanelsFromDefault(): FlatPanel[] {
  return flattenPanelTree(defaultSpCoinPanelTree).filter(
    (p) => !NON_PERSISTED_PANELS.has(p.panel),
  );
}
