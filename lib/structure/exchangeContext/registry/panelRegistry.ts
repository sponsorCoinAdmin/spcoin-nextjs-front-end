// File: lib/structure/exchangeContext/registry/panelRegistry.ts
import { SP_COIN_DISPLAY as SP } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import type { PanelNode, MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

export type PanelKind = 'root' | 'panel' | 'button' | 'list' | 'control';

type PanelDef = {
  id: SP;
  kind: PanelKind;
  overlay?: boolean;        // main radio overlay?
  defaultVisible?: boolean; // seed state
  children?: SP[];          // Test tree schema children
};

// ── Define panels ONCE here. To add a new main overlay: add { id, kind, overlay:true }.
export const PANEL_DEFS: PanelDef[] = [
  // Main overlays (radio group)
  { id: SP.TRADING_STATION_PANEL,       kind: 'root',  overlay: true,  defaultVisible: true  },
  { id: SP.BUY_SELECT_PANEL_LIST,       kind: 'list',  overlay: true,  defaultVisible: true  },
  { id: SP.SELL_SELECT_PANEL_LIST,      kind: 'list',  overlay: true,  defaultVisible: true  },
  { id: SP.RECIPIENT_SELECT_PANEL_LIST, kind: 'list',  overlay: true,  defaultVisible: false },
  { id: SP.AGENT_SELECT_PANEL_LIST,     kind: 'list',  overlay: true,  defaultVisible: false },
  { id: SP.ERROR_MESSAGE_PANEL,         kind: 'panel', overlay: true,  defaultVisible: false },
  { id: SP.SPONSOR_SELECT_PANEL_LIST,   kind: 'panel', overlay: true,  defaultVisible: false }, // legacy
  { id: SP.MANAGE_SPONSORSHIPS_PANEL,   kind: 'panel', overlay: true,  defaultVisible: false }, // ← new/added

  // Trading subtree (non-radio)
  { id: SP.SELL_SELECT_PANEL,           kind: 'panel', defaultVisible: true,  children: [SP.MANAGE_SPONSORSHIPS_BUTTON] },
  { id: SP.BUY_SELECT_PANEL,            kind: 'panel', defaultVisible: true,  children: [SP.ADD_SPONSORSHIP_BUTTON] },
  { id: SP.ADD_SPONSORSHIP_PANEL,       kind: 'panel', defaultVisible: false, children: [SP.CONFIG_SPONSORSHIP_PANEL] },
  { id: SP.CONFIG_SPONSORSHIP_PANEL,    kind: 'panel', defaultVisible: false },

  // Buttons
  { id: SP.ADD_SPONSORSHIP_BUTTON,      kind: 'button', defaultVisible: false },
  { id: SP.MANAGE_SPONSORSHIPS_BUTTON,  kind: 'button', defaultVisible: false },
];

// ── Derived: radio group used by the real app
export const MAIN_OVERLAY_GROUP: SP[] = PANEL_DEFS.filter(d => d.overlay).map(d => d.id);

// ── Derived: Test tree schema
export const ROOTS: SP[] = MAIN_OVERLAY_GROUP.slice(); // show all overlays as top-level in Test tree

export const CHILDREN: Partial<Record<SP, SP[]>> = PANEL_DEFS.reduce((acc, d) => {
  if (d.children?.length) acc[d.id] = d.children;
  return acc;
}, {} as Partial<Record<SP, SP[]>>);

export const KINDS: Partial<Record<SP, PanelKind>> =
  PANEL_DEFS.reduce((acc, d) => { acc[d.id] = d.kind; return acc; }, {} as Partial<Record<SP, PanelKind>>);

// ── Derived: default seed for settings.mainPanelNode
const nameOf = (id: SP) => (SP as any)[id] ?? String(id);
const buildSubtree = (id: SP): PanelNode => ({
  panel: id,
  name: nameOf(id),
  visible: !!PANEL_DEFS.find(d => d.id === id)?.defaultVisible,
  children: (CHILDREN[id] ?? []).map(buildSubtree),
});
export const defaultMainPanelNode: MainPanelNode = ROOTS.map((rootId) => buildSubtree(rootId));
