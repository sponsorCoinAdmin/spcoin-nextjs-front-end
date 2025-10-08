// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts
import type { SpCoinPanelTree, PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { SP_COIN_DISPLAY as SP } from '../enums/spCoinDisplay';

const n = (panel: SP, visible: boolean, children?: PanelNode[]): PanelNode => ({
  panel,
  name: SP[panel] ?? String(panel),
  visible,
  ...(children && children.length ? { children } : {}),
});

/**
 * Canonical authored tree (single source of truth).
 * Note: SPONSOR_SELECT_PANEL_LIST is intentionally not seeded/persisted.
 */
export const defaultSpCoinPanelTree: SpCoinPanelTree = [
  n(SP.MAIN_TRADING_PANEL, true, [
    n(SP.TRADE_CONTAINER_HEADER, true),

    n(SP.TRADING_STATION_PANEL, true, [
      n(SP.SELL_SELECT_PANEL, true, [n(SP.MANAGE_SPONSORSHIPS_BUTTON, false)]),
      n(SP.BUY_SELECT_PANEL, true, [n(SP.ADD_SPONSORSHIP_BUTTON, false)]),
    ]),

    // Radio overlays:
    n(SP.BUY_SELECT_PANEL_LIST, false),
    n(SP.SELL_SELECT_PANEL_LIST, false),
    n(SP.RECIPIENT_SELECT_PANEL_LIST, false),
    n(SP.AGENT_SELECT_PANEL_LIST, false),
    n(SP.ERROR_MESSAGE_PANEL, false),
    n(SP.MANAGE_SPONSORSHIPS_PANEL, false),

    // Inline/aux panels
    n(SP.ADD_SPONSORSHIP_PANEL, false),
    n(SP.CONFIG_SPONSORSHIP_PANEL, false),

    // Default-on widgets
    n(SP.SWAP_ARROW_BUTTON, true),
    n(SP.PRICE_BUTTON, true),
    n(SP.FEE_DISCLOSURE, true),

    // Default-off widget
    n(SP.AFFILIATE_FEE, false),
  ]),
];

export type FlatPanel = { panel: SP; name: string; visible: boolean };

/** Depth-first flatten of the authored tree (keeps authored visibility). */
export function flattenPanelTree(nodes: PanelNode[]): FlatPanel[] {
  const out: FlatPanel[] = [];
  const walk = (arr: PanelNode[]) => {
    for (const node of arr) {
      out.push({ panel: node.panel, name: node.name ?? SP[node.panel], visible: !!node.visible });
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

/** Utility: flatten + drop non-persisted for a fresh seed. */
export function seedPanelsFromDefault(): FlatPanel[] {
  const NON_PERSISTED = new Set<SP>([SP.SPONSOR_SELECT_PANEL_LIST]);
  return flattenPanelTree(defaultSpCoinPanelTree).filter((p) => !NON_PERSISTED.has(p.panel));
}
