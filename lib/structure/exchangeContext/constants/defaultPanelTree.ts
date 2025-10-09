// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts

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

/** Panels that should never be persisted/seeded (transient/ephemeral). */
export const NON_PERSISTED_PANELS = new Set<SP>([
  SP.SPONSOR_LIST_SELECT_PANEL,
]);

/** Panels expected on cold boot and their required default visibility. */
export const MUST_INCLUDE_ON_BOOT: ReadonlyArray<readonly [SP, boolean]> = [
  [SP.MAIN_TRADING_PANEL, true],
  [SP.TRADE_CONTAINER_HEADER, true],
  [SP.TRADING_STATION_PANEL, true],
  [SP.SELL_SELECT_PANEL, true],
  [SP.BUY_SELECT_PANEL, true],
  // widgets default-on:
  [SP.SWAP_ARROW_BUTTON, true],
  [SP.PRICE_BUTTON, true],
  [SP.FEE_DISCLOSURE, true],
  // widget default-off (tracked but hidden):
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

    // Radio overlays:
    node(SP.BUY_LIST_SELECT_PANEL, false),
    node(SP.SELL_LIST_SELECT_PANEL, false),
    node(SP.RECIPIENT_LIST_SELECT_PANEL, false),
    node(SP.AGENT_LIST_SELECT_PANEL, false),
    node(SP.ERROR_MESSAGE_PANEL, false),
    node(SP.MANAGE_SPONSORSHIPS_PANEL, false),

    // Inline/aux panels
    node(SP.ADD_SPONSORSHIP_PANEL, false),
    node(SP.CONFIG_SPONSORSHIP_PANEL, false),

    // Default-on widgets
    node(SP.SWAP_ARROW_BUTTON, true),
    node(SP.PRICE_BUTTON, true),
    node(SP.FEE_DISCLOSURE, true),

    // Default-off widget
    node(SP.AFFILIATE_FEE, false),
  ]),
];

/* ────────────────────────── utilities ─────────────────────────── */

export type FlatPanel = { panel: SP; name: string; visible: boolean };

/** Depth-first flatten of the authored tree (keeps authored visibility). */
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

/** Stable default order derived once from the canonical tree. */
export const DEFAULT_PANEL_ORDER: readonly SP[] = flattenPanelTree(defaultSpCoinPanelTree).map(
  (p) => p.panel
) as readonly SP[];

/** Flatten + drop non-persisted for a fresh seed. */
export function seedPanelsFromDefault(): FlatPanel[] {
  return flattenPanelTree(defaultSpCoinPanelTree).filter((p) => !NON_PERSISTED_PANELS.has(p.panel));
}
