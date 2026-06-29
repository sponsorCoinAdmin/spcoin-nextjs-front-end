// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts

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
  ...(children?.length ? { children } : {}),
});

/* ──────────────── Single Source of Truth (SSoT) ───────────────── */

/**
 * Panels that should NOT be persisted/seeded from the canonical tree.
 */
export const NON_PERSISTED_PANELS = new Set<SP>([]);

export const MUST_INCLUDE_ON_BOOT: readonly (readonly [SP, boolean])[] = [
  [SP.MERIT_WALLET_COMPONENT, true],
  [SP.TRADING_STATION_HEADER, true],
  [SP.MENU_TAB_HEADER_BAR, true],
  [SP.PANEL_SUB_TITLE, true],
  [SP.ACTIVE_ACCOUNT_HEADER_BAR, true],
  [SP.ADDRESS_HEADER_BAR, true],
  [SP.AGENT_HEADER_CONTAINER, true],
  [SP.TRADING_STATION_PANEL, true],
  [SP.CONFIG_SLIPPAGE_PANEL, false],
  [SP.EXCHANGE_TRADING_PAIR, true],
  [SP.SELL_SELECT_PANEL, true],
  [SP.BUY_SELECT_PANEL, true],
  [SP.SWAP_ARROW_BUTTON, true],
  [SP.CONNECT_TRADE_BUTTON, true],
  [SP.SEND_CONTRACT, false],
  [SP.ADD_SPONSORSHIP_PANEL_STAKING, false],
  [SP.CONFIG_SPONSORSHIP_PANEL_STAKING, false],
  [SP.CONNECT_TRADE_BUTTON_STAKING, true],
  [SP.WALLET_CONNECT_COMPONENT, true],
  [SP.WALLET_ACCOUNTS_COMPONENT, false],
  [SP.WALLET_NETWORKS_COMPONENT, false],
  [SP.WALLET_CONFIG_PANEL, false],
  [SP.FEE_DISCLOSURE, true],
  [SP.AFFILIATE_FEE, false],

  // ✅ Ensure overlays exist even for older persisted trees
  [SP.ACCOUNT_PANEL, false],
  [SP.ACCOUNT_LIST_SELECT_PANEL, false],

  // ✅ Ensure ACCOUNT_PANEL children exist even for older persisted trees
  [SP.ACTIVE_ACCOUNT, false],
  [SP.SPONSOR_ACCOUNT, false],
  [SP.RECIPIENT_ACCOUNT, false],
  [SP.AGENT_ACCOUNT, false],
  [SP.ACCOUNT_LOGO, true],
  [SP.ACCOUNT_META_DATA, true],

  // ✅ Ensure ACCOUNT_LIST_SELECT_PANEL children exist even for older persisted trees
  [SP.SPONSOR_LIST, false],
  [SP.RECIPIENT_LIST, false],
  [SP.AGENT_LIST, false],

  // ✅ Ensure TOKEN_PANEL exists even for older persisted trees
  [SP.TOKEN_PANEL, false],

  // ✅ Ensure TOKEN_PANEL children exist even for older persisted trees
  [SP.BUY_CONTRACT, false],
  [SP.SELL_CONTRACT, false],
  [SP.TOKEN_META_DATA, true],
  [SP.TOKEN_LOGO, true],

  // ✅ Ensure staking sub-panel exists even for older persisted trees
  [SP.STAKE_TRADING_SPCOINS_PANEL, false],

  // ✅ Manage panels are first-class overlays; ensure the landing panel exists.
  [SP.MANAGE_SPONSORSHIPS_PANEL, false],

  // ✅ Ensure chevron pending flags exist even for older persisted trees
  [SP.CHEVRON_DOWN_OPEN_PENDING, false],

  [SP.MANAGE_ACCOUNTS_PANEL, false],
  [SP.SPONSOR_PANEL, false],
  [SP.SEND_PANEL, false],
  [SP.SEND_RECIPIENT_SELECT_PANEL, false],
  [SP.SEND_SELECT_PANEL, true],
  [SP.SEND_ADDRESS_HEADER_BAR, true],
] as const;

/**
 * Canonical authored tree for the SponsorCoin UI.
 */
export const defaultSpCoinPanelTree: SpCoinPanelTree = [
  node(SP.MERIT_WALLET_COMPONENT, true, [
    // Header bars
    node(SP.AGENT_HEADER_CONTAINER, true),
    node(SP.ACTIVE_ACCOUNT_HEADER_BAR, true),
    node(SP.ADDRESS_HEADER_BAR, true),
    node(SP.MENU_TAB_HEADER_BAR, true),
    node(SP.PANEL_SUB_TITLE, true),

    // Core trading station subtree
    node(SP.TRADING_STATION_PANEL, true, [
      node(SP.TRADING_STATION_HEADER, true),
      node(SP.CONFIG_SLIPPAGE_PANEL, false),
      node(SP.EXCHANGE_TRADING_PAIR, true, [
        node(SP.SELL_SELECT_PANEL, true, [node(SP.MANAGE_SPONSORSHIPS_BUTTON, false)]),
        node(SP.SWAP_ARROW_BUTTON, true),
        node(SP.BUY_SELECT_PANEL, true, [node(SP.ADD_SPONSORSHIP_BUTTON, false)]),
      ]),
      node(SP.ADD_SPONSORSHIP_PANEL, false),
      node(SP.CONNECT_TRADE_BUTTON, true),
      node(SP.FEE_DISCLOSURE, true),
      node(SP.AFFILIATE_FEE, false),
    ]),

    // ─────────────── Radio overlays (siblings) ───────────────
    node(SP.TOKEN_LIST_SELECT_PANEL, false, [node(SP.SEND_CONTRACT, false)]),

    node(SP.ACCOUNT_LIST_SELECT_PANEL, false, [
      node(SP.SPONSOR_LIST, false),
      node(SP.RECIPIENT_LIST, false),
      node(SP.AGENT_LIST, false),
    ]),

    node(SP.ERROR_MESSAGE_PANEL, false),

    node(SP.TOKEN_PANEL, false, [
      node(SP.BUY_CONTRACT, false),
      node(SP.SELL_CONTRACT, false),
      node(SP.TOKEN_META_DATA, true),
      node(SP.TOKEN_LOGO, true),
    ]),

    node(SP.CHEVRON_DOWN_OPEN_PENDING, false),

    node(SP.MANAGE_SPONSORSHIPS_PANEL, false, [node(SP.MANAGE_PENDING_REWARDS, false)]),

    node(SP.STAKING_SPCOINS_PANEL, false, [
      node(SP.STAKE_TRADING_SPCOINS_PANEL, false),
      node(SP.ADD_SPONSORSHIP_PANEL_STAKING, false, [node(SP.CONFIG_SPONSORSHIP_PANEL_STAKING, false)]),
      node(SP.CONNECT_TRADE_BUTTON_STAKING, true),
    ]),

    node(SP.ACCOUNT_LIST_REWARDS_PANEL, false, [
      node(SP.PENDING_SPONSOR_REWARDS, false),
      node(SP.PENDING_RECIPIENT_REWARDS, false),
      node(SP.PENDING_AGENT_REWARDS, false),
      node(SP.ACTIVE_SPONSORSHIPS, false),
    ]),

    node(SP.ACCOUNT_PANEL, false, [
      node(SP.ACTIVE_ACCOUNT, false),
      node(SP.SPONSOR_ACCOUNT, false),
      node(SP.RECIPIENT_ACCOUNT, false),
      node(SP.AGENT_ACCOUNT, false),
      node(SP.ACCOUNT_LOGO, true),
      node(SP.ACCOUNT_META_DATA, true),
    ]),

    node(SP.WALLET_ACCOUNTS_COMPONENT, false),
    node(SP.WALLET_NETWORKS_COMPONENT, false),
    node(SP.WALLET_CONFIG_PANEL, false),
    node(SP.MANAGE_ACCOUNTS_PANEL, false),
    node(SP.SPONSOR_PANEL, false),
    node(SP.SEND_PANEL, false, [
      node(SP.SEND_SELECT_PANEL, true),
      node(SP.SEND_ADDRESS_HEADER_BAR, true),
    ]),
    node(SP.SEND_RECIPIENT_SELECT_PANEL, false),

    node(SP.WALLET_CONNECT_COMPONENT, true),
  ]),
];

/* ────────────────────────── utilities ─────────────────────────── */

export interface FlatPanel {
  panel: SP;
  name: string;
  visible: boolean;
}

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
