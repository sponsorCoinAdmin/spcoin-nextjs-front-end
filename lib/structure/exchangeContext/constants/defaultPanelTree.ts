// File: @/lib/structure/exchangeContext/constants/defaultPanelTree.ts

import type { SpCoinPanelTree, PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { SP_COIN_DISPLAY as SP } from '../enums/spCoinDisplay';

/* ─────────────────────────── helpers ─────────────────────────── */

const node = (panel: SP, visible: boolean, children?: PanelNode[]): PanelNode => ({
  panel,
  name: SP[panel] ?? String(panel),
  visible,
  ...(children && children.length ? { children } : {}),
});

/* ──────────────── Single Source of Truth (SSoT) ───────────────── */

export const NON_PERSISTED_PANELS = new Set<SP>([SP.SPONSOR_LIST_SELECT_PANEL]);

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
 * Canonical authored tree (persistable structure).
 * Note: SPONSOR_LIST_SELECT_PANEL is intentionally excluded.
 */
export const defaultSpCoinPanelTree: SpCoinPanelTree = [
  node(SP.MAIN_TRADING_PANEL, true, [
    node(SP.TRADE_CONTAINER_HEADER, true),

    node(SP.TRADING_STATION_PANEL, true, [
      node(SP.SELL_SELECT_PANEL, true, [node(SP.MANAGE_SPONSORSHIPS_BUTTON, false)]),
      node(SP.BUY_SELECT_PANEL, true, [node(SP.ADD_SPONSORSHIP_BUTTON, false)]),
    ]),

    // Radio overlays (top-level siblings)
    node(SP.BUY_LIST_SELECT_PANEL, false),
    node(SP.SELL_LIST_SELECT_PANEL, false),
    node(SP.RECIPIENT_LIST_SELECT_PANEL, false),
    node(SP.AGENT_LIST_SELECT_PANEL, false),
    node(SP.ERROR_MESSAGE_PANEL, false),

    // Manage overlays as top-level entries
    // ⬇️ New: MANAGE_PENDING_REWARDS nested under MANAGE_SPONSORSHIPS_PANEL
    node(SP.MANAGE_SPONSORSHIPS_PANEL, false, [
      node(SP.MANAGE_PENDING_REWARDS, false),
    ]),
    node(SP.MANAGE_RECIPIENTS_PANEL, false),
    node(SP.MANAGE_AGENTS_PANEL, false),
    node(SP.MANAGE_SPONSORS_PANEL, false),

    // ✅ Detail views (ensure all three are present)
    node(SP.MANAGE_AGENT_PANEL, false),
    node(SP.MANAGE_RECIPIENT_PANEL, false),
    node(SP.MANAGE_SPONSOR_PANEL, false),

    // Inline/aux panels
    node(SP.ADD_SPONSORSHIP_PANEL, false),
    node(SP.CONFIG_SPONSORSHIP_PANEL, false),

    // Default-on widgets
    node(SP.SWAP_ARROW_BUTTON, true),
    node(SP.CONNECT_PRICE_BUTTON, true),
    node(SP.FEE_DISCLOSURE, true),

    // Default-off widget
    node(SP.AFFILIATE_FEE, false),
  ]),
];

/* ────────────────────────── utilities ─────────────────────────── */

export type FlatPanel = { panel: SP; name: string; visible: boolean };

export function flattenPanelTree(nodes: PanelNode[]): FlatPanel[] {
  const out: FlatPanel[] = [];
  const walk = (arr: PanelNode[]) => {
    for (const n of arr) {
      out.push({ panel: n.panel, name: n.name ?? SP[n.panel], visible: !!n.visible });
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
