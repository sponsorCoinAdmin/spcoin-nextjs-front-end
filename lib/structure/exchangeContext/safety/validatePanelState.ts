// File: lib/structure/exchangeContext/safety/validatePanelState.ts
import { SP_COIN_DISPLAY as SP } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import type { PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { PANEL_DEFS, MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';

const nameOf = (id: number) => (SP as any)[id] ?? String(id);

const ALLOWED_IDS = new Set<number>(PANEL_DEFS.map((d) => d.id));
const NON_PERSISTED = new Set<number>([SP.SPONSOR_SELECT_PANEL_LIST]);

const REQUIRED_SEED = PANEL_DEFS
  .filter((d) => typeof d.defaultVisible === 'boolean' && !NON_PERSISTED.has(d.id))
  .map((d) => ({ id: d.id, visible: !!d.defaultVisible }));

export function validateAndRepairPanels(input: PanelNode[]) {
  const reasons: string[] = [];
  const map = new Map<number, PanelNode>();

  for (const n of input || []) {
    const id = Number(n?.panel);
    if (!Number.isFinite(id)) continue;
    if (!ALLOWED_IDS.has(id)) {
      reasons.push(`Dropped unknown panel id ${id}`);
      continue;
    }
    if (NON_PERSISTED.has(id)) {
      reasons.push(`Removed non-persisted: ${nameOf(id)}`);
      continue;
    }
    map.set(id, { panel: id, name: n.name ?? nameOf(id), visible: !!n.visible });
  }

  for (const { id, visible } of REQUIRED_SEED) {
    if (!map.has(id)) {
      map.set(id, { panel: id, name: nameOf(id), visible });
      reasons.push(`Added missing panel ${nameOf(id)}`);
    }
  }

  const overlayIds = new Set<number>(MAIN_OVERLAY_GROUP);
  const visibleOverlays = [...map.values()].filter((n) => overlayIds.has(n.panel) && n.visible);

  if (visibleOverlays.length > 1) {
    const preferred =
      map.get(SP.TRADING_STATION_PANEL) && map.get(SP.TRADING_STATION_PANEL)!.visible
        ? SP.TRADING_STATION_PANEL
        : visibleOverlays[0].panel;

    for (const n of visibleOverlays) {
      if (n.panel !== preferred) {
        map.set(n.panel, { ...n, visible: false });
      }
    }
    reasons.push('Normalized overlays to a single visible one');
  }

  const panels = PANEL_DEFS
    .map((d) => map.get(d.id))
    .filter(Boolean)
    .map((n) => ({ panel: n!.panel, name: n!.name ?? nameOf(n!.panel), visible: !!n!.visible }));

  return { panels, repaired: reasons.length > 0, reasons };
}
