// File: @/lib/structure/exchangeContext/constants/defaultPanelTree.ts

import type {
  SpCoinPanelTree,
  PanelNode,
} from '@/lib/structure/exchangeContext/types/PanelNode';
import { SP_COIN_DISPLAY as SP } from '../enums/spCoinDisplay';

/* ─────────────────────────── helpers ─────────────────────────── */

const panelName = (panel: SP) => SP[panel] ?? String(panel);

/**
 * Create a PanelNode with a derived `name` and optional children.
 * - `children` are only added if the array is non-empty.
 */
const node = (panel: SP, visible: boolean, children?: PanelNode[]): PanelNode => ({
  panel,
  name: panelName(panel),
  visible,
  ...(children && children.length ? { children } : {}),
});

/* ──────────────── Single Source of Truth (SSoT) ───────────────── */

/**
 * Panels that should NOT be persisted/seeded from the canonical tree.
 */
export const NON_PERSISTED_PANELS = new Set<SP>([]);

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

  // ✅ Ensure overlays exist even for older persisted trees
  [SP.PANEL_LIST_SELECT_PANEL, false],
  [SP.TOKEN_LIST_SELECT_PANEL, false],
  [SP.ACCOUNT_PANEL, false],

  // ✅ Ensure TOKEN_CONTRACT_PANEL exists even for older persisted trees
  [SP.TOKEN_CONTRACT_PANEL, false],

  // ✅ Manage panels are first-class overlays; ensure the landing panel exists.
  [SP.MANAGE_SPONSORSHIPS_PANEL, false],

  // ✅ Ensure chevron pending flags exist even for older persisted trees
  [SP.CHEVRON_DOWN_OPEN_PENDING, false],
] as const;

/**
 * Canonical authored tree for the SponsorCoin UI.
 */
export const defaultSpCoinPanelTree: SpCoinPanelTree = [
  node(SP.MAIN_TRADING_PANEL, true, [
    node(SP.TRADE_CONTAINER_HEADER, true, [
      // Core trading station subtree
      node(SP.TRADING_STATION_PANEL, true, [
        node(SP.SELL_SELECT_PANEL, true, [node(SP.MANAGE_SPONSORSHIPS_BUTTON, false)]),
        node(SP.BUY_SELECT_PANEL, true, [node(SP.ADD_SPONSORSHIP_BUTTON, false)]),
      ]),

      // ─────────────── Radio overlays (siblings) ───────────────
      node(SP.PANEL_LIST_SELECT_PANEL, false),
      node(SP.TOKEN_LIST_SELECT_PANEL, false),
      node(SP.BUY_LIST_SELECT_PANEL, false),
      node(SP.SELL_LIST_SELECT_PANEL, false),

      // ✅ OLD: legacy list overlays (kept during migration)
      node(SP.RECIPIENT_LIST_SELECT_PANEL, false),
      node(SP.AGENT_LIST_SELECT_PANEL, false),

      node(SP.ERROR_MESSAGE_PANEL, false),

      // ✅ Token contract overlay MUST be part of overlay tree now
      node(SP.TOKEN_CONTRACT_PANEL, false),

      // ✅ Chevron pending flags (persisted UI state; not a visible overlay)
      node(SP.CHEVRON_DOWN_OPEN_PENDING, false),

      // ─────────────── Manage overlays (still overlays, but with an inline child) ───────────────
      node(SP.MANAGE_SPONSORSHIPS_PANEL, false, [node(SP.MANAGE_PENDING_REWARDS, false)]),

      node(SP.STAKING_SPCOINS_PANEL, false),

      // ✅ Account list rewards (parent) + pending/unstake nodes (no mode children)
      node(SP.ACCOUNT_LIST_REWARDS_PANEL, false, [
        node(SP.PENDING_SPONSOR_COINS, false),
        node(SP.PENDING_RECIPIENT_COINS, false),
        node(SP.PENDING_AGENT_COINS, false),
        node(SP.UNSPONSOR_SP_COINS, false),
      ]),

      // Shared / detail overlays
      node(SP.ACCOUNT_PANEL, false),
      node(SP.AGENT_ACCOUNT_PANEL, false),
      node(SP.RECIPIENT_ACCOUNT_PANEL, false),
      node(SP.SPONSOR_ACCOUNT_PANEL, false),

      // Aux panels
      node(SP.ADD_SPONSORSHIP_PANEL, false),
      node(SP.CONFIG_SPONSORSHIP_PANEL, false),

      // Default-on widgets
      node(SP.SWAP_ARROW_BUTTON, true),
      node(SP.CONNECT_TRADE_BUTTON, true),
      node(SP.FEE_DISCLOSURE, true),

      // Default-off widget
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

/** Single-pass flatten (iterative; no nested closures) */
export function flattenPanelTree(nodes: PanelNode[]): FlatPanel[] {
  const out: FlatPanel[] = [];
  const stack: PanelNode[] = [...nodes].reverse();

  while (stack.length) {
    const n = stack.pop()!;
    out.push({
      panel: n.panel,
      name: n.name ?? panelName(n.panel),
      visible: !!n.visible,
    });

    if (n.children?.length) {
      // preserve original order
      for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]!);
    }
  }

  return out;
}

/** Flatten once, reuse everywhere */
const DEFAULT_FLAT = flattenPanelTree(defaultSpCoinPanelTree);

export const DEFAULT_PANEL_ORDER: readonly SP[] = DEFAULT_FLAT.map((p) => p.panel) as readonly SP[];

/** Seed persisted panel visibility from the canonical authored tree */
export function seedPanelsFromDefault(): FlatPanel[] {
  return DEFAULT_FLAT.filter((p) => !NON_PERSISTED_PANELS.has(p.panel));
}
