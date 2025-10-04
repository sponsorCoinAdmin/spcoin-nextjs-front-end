// File: lib/structure/exchangeContext/registry/panelRegistry.ts
import { SP_COIN_DISPLAY as SP } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import type { PanelNode, MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

export type PanelKind = 'root' | 'panel' | 'button' | 'list' | 'control';

type PanelDef = {
  id: SP;
  kind: PanelKind;
  overlay?: boolean;        // main radio overlay?
  defaultVisible?: boolean; // seed state
  children?: SP[];          // Test tree / virtual schema children
};

// ───────────────── Virtual grouping helpers ─────────────────

// Trading Station inline children (controls + inline panels under Trading view)
const TRADING_CHILDREN: SP[] = [
  SP.SELL_SELECT_PANEL,
  SP.BUY_SELECT_PANEL,
  SP.ADD_SPONSORSHIP_PANEL,
  SP.SWAP_ARROW_BUTTON,
  SP.PRICE_BUTTON,
  SP.FEE_DISCLOSURE,
  SP.AFFILIATE_FEE,
  // ⛔️ Not here: SP.MANAGE_SPONSORSHIPS_PANEL (it’s a top-level overlay)
];

// MAIN_TRADING_PANEL’s children = all radio overlays (top-level modals)
const MAIN_TRADING_CHILDREN: SP[] = [
  SP.TRADING_STATION_PANEL,
  SP.BUY_SELECT_PANEL_LIST,
  SP.SELL_SELECT_PANEL_LIST,
  SP.RECIPIENT_SELECT_PANEL_LIST,
  SP.AGENT_SELECT_PANEL_LIST,
  SP.ERROR_MESSAGE_PANEL,
  SP.MANAGE_SPONSORSHIPS_PANEL,
  // (legacy, if you want it shown): SP.SPONSOR_SELECT_PANEL_LIST,
];

// ── Define panels ONCE here. To add a new main overlay: add { id, kind, overlay:true }.
export const PANEL_DEFS: PanelDef[] = [
  // 🚀 Top-level gate (NOT a radio overlay)
  {
    id: SP.MAIN_TRADING_PANEL,
    kind: 'root',
    defaultVisible: true,
    children: MAIN_TRADING_CHILDREN,
  },

  // Main overlays (radio group)
  {
    id: SP.TRADING_STATION_PANEL,
    kind: 'root',
    overlay: true,
    defaultVisible: true,
    children: TRADING_CHILDREN,
  },
  { id: SP.BUY_SELECT_PANEL_LIST,       kind: 'list',  overlay: true,  defaultVisible: true  },
  { id: SP.SELL_SELECT_PANEL_LIST,      kind: 'list',  overlay: true,  defaultVisible: true  },
  { id: SP.RECIPIENT_SELECT_PANEL_LIST, kind: 'list',  overlay: true,  defaultVisible: false },
  { id: SP.AGENT_SELECT_PANEL_LIST,     kind: 'list',  overlay: true,  defaultVisible: false },
  { id: SP.ERROR_MESSAGE_PANEL,         kind: 'panel', overlay: true,  defaultVisible: false },
  { id: SP.MANAGE_SPONSORSHIPS_PANEL,   kind: 'panel', overlay: true,  defaultVisible: false },

  // Legacy overlay (kept for compatibility)
  { id: SP.SPONSOR_SELECT_PANEL_LIST,   kind: 'list',  overlay: true,  defaultVisible: false },

  // Trading subtree (non-radio)
  { id: SP.SELL_SELECT_PANEL,           kind: 'panel', defaultVisible: true,  children: [SP.MANAGE_SPONSORSHIPS_BUTTON] },
  { id: SP.BUY_SELECT_PANEL,            kind: 'panel', defaultVisible: true,  children: [SP.ADD_SPONSORSHIP_BUTTON] },
  { id: SP.ADD_SPONSORSHIP_PANEL,       kind: 'panel', defaultVisible: false, children: [SP.CONFIG_SPONSORSHIP_PANEL] },
  { id: SP.CONFIG_SPONSORSHIP_PANEL,    kind: 'panel', defaultVisible: false },

  // Buttons
  { id: SP.ADD_SPONSORSHIP_BUTTON,      kind: 'button', defaultVisible: false },
  { id: SP.MANAGE_SPONSORSHIPS_BUTTON,  kind: 'button', defaultVisible: false },
];

// ── Derived: radio group used by the real app (exclude MAIN_TRADING_PANEL)
export const MAIN_OVERLAY_GROUP: SP[] = PANEL_DEFS
  .filter((d) => d.overlay === true)
  .map((d) => d.id);

// ── Derived: Test tree schema (single root = MAIN_TRADING_PANEL)
export const ROOTS: SP[] = [SP.MAIN_TRADING_PANEL];

export const CHILDREN: Partial<Record<SP, SP[]>> =
  PANEL_DEFS.reduce<Partial<Record<SP, SP[]>>>((acc, d) => {
    if (Array.isArray(d.children) && d.children.length > 0) {
      acc[d.id] = d.children as SP[];
    }
    return acc;
  }, {});

export const KINDS: Partial<Record<SP, PanelKind>> =
  PANEL_DEFS.reduce<Partial<Record<SP, PanelKind>>>((acc, d) => {
    acc[d.id] = d.kind;
    return acc;
  }, {});

// ── Derived: default seed for settings.mainPanelNode (⚠️ flat; no children)
const nameOf = (id: SP) => (SP as any)[id] ?? String(id);

export const defaultMainPanelNode: MainPanelNode =
  PANEL_DEFS.map<PanelNode>(({ id, defaultVisible }) => ({
    panel: id,
    name: nameOf(id),
    visible: !!defaultVisible,
  }));
