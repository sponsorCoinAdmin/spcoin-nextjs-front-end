// File: @/lib/structure/exchangeContext/safety/validatePanelState.ts

import { SP_COIN_DISPLAY as SP } from '@/lib/structure';
import type { PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { PANEL_DEFS, MAIN_RADIO_OVERLAY_PANELS } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { NON_PERSISTED_PANELS } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';

const nameOf = (id: number) => (SP as any)[id] ?? String(id);
const LEGACY_BUY_LIST_NAME = 'BUY_LIST_SELECT_PANEL';
const mapLegacyPanelId = (id: number, name?: string): number => {
  const label = (name ?? nameOf(id)) as string;
  return label === LEGACY_BUY_LIST_NAME ? SP.TOKEN_LIST_SELECT_PANEL : id;
};

const ALLOWED_IDS = new Set<number>(PANEL_DEFS.map((d) => d.id));

const REQUIRED_SEED = PANEL_DEFS
  .filter((d) => typeof d.defaultVisible === 'boolean' && !NON_PERSISTED_PANELS.has(d.id))
  .map((d) => ({ id: d.id, visible: !!d.defaultVisible }));

export function validateAndRepairPanels(input: PanelNode[]) {
  const reasons: string[] = [];
  const map = new Map<number, PanelNode>();

  // 1) Filter to known + persistable; de-dupe by id
  for (const n of input || []) {
    const rawId = Number(n?.panel);
    const id = mapLegacyPanelId(rawId, n?.name);
    if (!Number.isFinite(id)) continue;
    if (!ALLOWED_IDS.has(id)) {
      reasons.push(`Dropped unknown panel id ${id}`);
      continue;
    }
    if (NON_PERSISTED_PANELS.has(id as SP)) {
      reasons.push(`Removed non-persisted: ${nameOf(id)}`);
      continue;
    }
    map.set(id, { panel: id, name: n.name ?? nameOf(id), visible: !!n.visible });
  }

  // 2) Ensure required panels exist with registry default visibility
  for (const { id, visible } of REQUIRED_SEED) {
    if (!map.has(id)) {
      map.set(id, { panel: id, name: nameOf(id), visible });
      reasons.push(`Added missing panel ${nameOf(id)}`);
    }
  }

  // 3) Overlay group: enforce a single visible overlay, prefer TRADING_STATION_PANEL
  const overlayIds = new Set<number>(MAIN_RADIO_OVERLAY_PANELS as number[]);
  const visibleOverlays = [...map.values()].filter((n) => overlayIds.has(n.panel) && n.visible);

  if (visibleOverlays.length > 1) {
    const preferred =
      map.get(SP.TRADING_STATION_PANEL) && map.get(SP.TRADING_STATION_PANEL)!.visible
        ? SP.TRADING_STATION_PANEL
        : visibleOverlays[0].panel;

    for (const n of visibleOverlays) {
      if (n.panel !== preferred) map.set(n.panel, { ...n, visible: false });
    }
    reasons.push('Normalized overlays to a single visible one');
  }

  // 4) Stable order as declared by the registry
  const panels = PANEL_DEFS
    .map((d) => map.get(d.id))
    .filter(Boolean)
    .map((n) => ({ panel: n!.panel, name: n!.name ?? nameOf(n!.panel), visible: !!n!.visible }));

  return { panels, repaired: reasons.length > 0, reasons };
}
