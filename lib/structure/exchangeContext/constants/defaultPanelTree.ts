// File: lib/structure/exchangeContext/constants/defaultPanelTree.ts
import type { SpCoinPanelTree, PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { SP_COIN_DISPLAY as SP } from '../enums/spCoinDisplay';

const DEBUG_SEED =
  (process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_SEED ?? 'false').toLowerCase() === 'true';

const n = (panel: SP, visible: boolean, children?: PanelNode[]): PanelNode => ({
  panel,
  name: SP[panel] ?? String(panel),
  visible,
  ...(children && children.length ? { children } : {}),
});

/**
 * Seed all panels in a single rooted tree.
 * Note: SPONSOR_SELECT_PANEL_LIST is **never persisted**, so it's not seeded here.
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

/** Panels that should never be persisted/seeded (transient/ephemeral). */
const NON_PERSISTED = new Set<SP>([
  SP.SPONSOR_SELECT_PANEL_LIST, // explicitly excluded from seed/persist
]);

/** Depth-first flatten of the authored tree (keeps authored visibility). */
export function flattenPanelTree(nodes: PanelNode[]): FlatPanel[] {
  const out: FlatPanel[] = [];
  const walk = (arr: PanelNode[], depth = 0, parent?: string) => {
    for (const node of arr) {
      out.push({ panel: node.panel, name: node.name ?? SP[node.panel], visible: !!node.visible });
      if (DEBUG_SEED) {
        const d = '  '.repeat(depth);
        console.log(
          `%cseed:tree`,
          'color:#7aa2f7',
          `${d}${SP[node.panel]} {visible:${!!node.visible}}`,
          parent ? `(parent:${parent})` : ''
        );
      }
      if (node.children?.length) walk(node.children, depth + 1, SP[node.panel]);
    }
  };
  if (DEBUG_SEED) {
    console.groupCollapsed('%cseed:flattenPanelTree(start)', 'color:#7aa2f7;font-weight:bold;');
  }
  walk(nodes);
  if (DEBUG_SEED) {
    console.log('%cseed:flattenPanelTree(count)', 'color:#7aa2f7', out.length);
    console.groupEnd();
  }
  return out;
}

/**
 * Seed panels for a fresh ExchangeContext when local storage is empty.
 * - Flattens the default tree exactly as written.
 * - Drops any NON_PERSISTED panels.
 * - Emits diagnostics about missing/extra core/widget panels.
 */
export function seedPanelsFromDefault(): FlatPanel[] {
  const flat = flattenPanelTree(defaultSpCoinPanelTree);
  const seeded = flat.filter(p => !NON_PERSISTED.has(p.panel));

  if (DEBUG_SEED) {
    console.groupCollapsed('%cseed:seedPanelsFromDefault', 'color:#a6e3a1;font-weight:bold;');
    console.table(
      seeded.map(p => ({ panel: p.panel, name: p.name, visible: p.visible }))
    );

    // Quick presence checks (these help spot why your current seed was missing widgets)
    const mustIncludeOnBoot: Array<[SP, boolean /*visible*/]> = [
      [SP.MAIN_TRADING_PANEL, true],
      [SP.TRADE_CONTAINER_HEADER, true],
      [SP.TRADING_STATION_PANEL, true],
      [SP.SELL_SELECT_PANEL, true],
      [SP.BUY_SELECT_PANEL, true],
      [SP.SWAP_ARROW_BUTTON, true],
      [SP.PRICE_BUTTON, true],
      [SP.FEE_DISCLOSURE, true],
    ];
    const neverPersist = [SP.SPONSOR_SELECT_PANEL_LIST];

    const map = new Map(seeded.map(p => [p.panel, p]));
    const missing = mustIncludeOnBoot.filter(([id]) => !map.has(id));
    const wrongVisibility = mustIncludeOnBoot.filter(
      ([id, vis]) => map.has(id) && map.get(id)!.visible !== vis
    );
    const accidentallyIncluded = neverPersist.filter(id => map.has(id));

    console.log('%cseed:checks.missing', 'color:#f38ba8', missing.map(([id]) => SP[id]));
    console.log(
      '%cseed:checks.wrongVisibility',
      'color:#fab387',
      wrongVisibility.map(([id, vis]) => ({ name: SP[id], expected: vis, got: map.get(id)?.visible }))
    );
    console.log(
      '%cseed:checks.accidentallyIncluded',
      'color:#f38ba8',
      accidentallyIncluded.map(id => SP[id])
    );

    console.groupEnd();
  }

  return seeded;
}
