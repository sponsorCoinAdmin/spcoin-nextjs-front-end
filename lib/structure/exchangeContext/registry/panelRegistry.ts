// FILE: lib\structure\exchangeContext\registry\panelRegistry.ts

import { SP_COIN_DISPLAY as SP } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

export type PanelKind = 'root' | 'panel' | 'button' | 'list' | 'control';

type PanelDef = {
  id: SP;
  kind: PanelKind;
  overlay?: boolean;
  defaultVisible?: boolean;
  children?: SP[];
};

// ───────────────── Virtual grouping helpers ─────────────────

const TRADING_CHILDREN: SP[] = [
  SP.SELL_SELECT_PANEL,
  SP.BUY_SELECT_PANEL,
  SP.ADD_SPONSORSHIP_PANEL,
  SP.SWAP_ARROW_BUTTON,
  SP.PRICE_BUTTON,
  SP.FEE_DISCLOSURE,
  SP.AFFILIATE_FEE,
];

const MAIN_TRADING_CHILDREN: SP[] = [
  SP.TRADE_CONTAINER_HEADER,
  SP.TRADING_STATION_PANEL,
  SP.BUY_LIST_SELECT_PANEL,
  SP.SELL_LIST_SELECT_PANEL,
  SP.RECIPIENT_LIST_SELECT_PANEL,
  SP.AGENT_LIST_SELECT_PANEL,
  SP.ERROR_MESSAGE_PANEL,
  SP.MANAGE_SPONSORSHIPS_PANEL,
];

// ✅ New: Children that live under MANAGE_SPONSORSHIPS_PANEL
const MANAGE_SPONSORSHIPS_CHILDREN: SP[] = [
  SP.MANAGE_RECIPIENTS_PANEL,
  SP.MANAGE_AGENTS_PANEL,
  SP.MANAGE_SPONSORS_PANEL,
];

export const PANEL_DEFS: readonly PanelDef[] = [
  { id: SP.MAIN_TRADING_PANEL, kind: 'root', defaultVisible: true, children: MAIN_TRADING_CHILDREN },
  { id: SP.TRADE_CONTAINER_HEADER, kind: 'panel', defaultVisible: true },

  { id: SP.TRADING_STATION_PANEL, kind: 'root', overlay: true, defaultVisible: true, children: TRADING_CHILDREN },
  { id: SP.BUY_LIST_SELECT_PANEL, kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.SELL_LIST_SELECT_PANEL, kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.RECIPIENT_LIST_SELECT_PANEL, kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.AGENT_LIST_SELECT_PANEL,     kind: 'list', overlay: true, defaultVisible: false },
  { id: SP.ERROR_MESSAGE_PANEL, kind: 'panel', overlay: true, defaultVisible: false },

  // 🔧 Manage overlay with its nested children (not overlays)
  { id: SP.MANAGE_SPONSORSHIPS_PANEL, kind: 'panel', overlay: true, defaultVisible: false, children: MANAGE_SPONSORSHIPS_CHILDREN },
  { id: SP.MANAGE_RECIPIENTS_PANEL,   kind: 'panel', defaultVisible: false },
  { id: SP.MANAGE_AGENTS_PANEL,       kind: 'panel', defaultVisible: false },
  { id: SP.MANAGE_SPONSORS_PANEL,     kind: 'panel', defaultVisible: false },

  { id: SP.SPONSOR_LIST_SELECT_PANEL, kind: 'list', overlay: true, defaultVisible: false }, // legacy

  { id: SP.SELL_SELECT_PANEL, kind: 'panel', defaultVisible: true, children: [SP.MANAGE_SPONSORSHIPS_BUTTON] },
  { id: SP.BUY_SELECT_PANEL,  kind: 'panel', defaultVisible: true, children: [SP.ADD_SPONSORSHIP_BUTTON] },
  { id: SP.ADD_SPONSORSHIP_PANEL,     kind: 'panel', defaultVisible: false, children: [SP.CONFIG_SPONSORSHIP_PANEL] },
  { id: SP.CONFIG_SPONSORSHIP_PANEL,  kind: 'panel', defaultVisible: false },

  { id: SP.SWAP_ARROW_BUTTON, kind: 'control', defaultVisible: true },
  { id: SP.PRICE_BUTTON,      kind: 'control', defaultVisible: true },
  { id: SP.FEE_DISCLOSURE,    kind: 'panel',   defaultVisible: true },
  { id: SP.AFFILIATE_FEE,     kind: 'panel',   defaultVisible: false },

  { id: SP.ADD_SPONSORSHIP_BUTTON,    kind: 'button', defaultVisible: false },
  { id: SP.MANAGE_SPONSORSHIPS_BUTTON, kind: 'button', defaultVisible: false },
] as const;

export const MAIN_OVERLAY_GROUP: readonly SP[] =
  PANEL_DEFS.filter((d) => d.overlay === true).map((d) => d.id) as readonly SP[];

// ✅ Panels that should never show an index in the inspector
export const NON_INDEXED_PANELS = new Set<SP>([
  SP.MAIN_TRADING_PANEL,
  SP.TRADE_CONTAINER_HEADER,
]);

export const ROOTS: SP[] = [SP.MAIN_TRADING_PANEL];

export const CHILDREN: Partial<Record<SP, SP[]>> = PANEL_DEFS.reduce((acc, d) => {
  if (Array.isArray(d.children) && d.children.length > 0) acc[d.id] = d.children as SP[];
  return acc;
}, {} as Partial<Record<SP, SP[]>>);

export const KINDS: Partial<Record<SP, PanelKind>> = PANEL_DEFS.reduce((acc, d) => {
  acc[d.id] = d.kind;
  return acc;
}, {} as Partial<Record<SP, PanelKind>>);

// Re-export canonical default tree (SSoT)
export { defaultSpCoinPanelTree } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
