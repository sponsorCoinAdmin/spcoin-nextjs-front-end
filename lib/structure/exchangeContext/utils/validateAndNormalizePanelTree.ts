// File: @/lib/structure/exchangeContext/utils/validateAndNormalizePanelTree.ts
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { defaultSpCoinPanelTree } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';

export type PanelEntry = { panel: SP; visible: boolean };
export type NormalizeResult = {
  normalized: PanelEntry[]; // flat list
  repaired: boolean;        // true if we had to change anything
  notes: string[];          // human-readable reasons for repairs
};

// --- helpers ---
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function flatten(nodes: any[] | undefined): PanelEntry[] {
  if (!Array.isArray(nodes)) return [];
  const out: PanelEntry[] = [];
  const walk = (ns: any[]) => {
    for (const n of ns) {
      if (n && typeof n === 'object') {
        const p = (n as any).panel;
        const v = !!(n as any).visible;
        if (isNumber(p)) out.push({ panel: p as SP, visible: v });
        if (Array.isArray((n as any).children)) walk((n as any).children);
      }
    }
  };
  walk(nodes);
  return out;
}

function uniqLastByPanel(list: PanelEntry[]): PanelEntry[] {
  const map = new Map<number, PanelEntry>();
  for (const e of list) map.set(e.panel, e);
  return Array.from(map.values());
}

function allEnumPanels(): SP[] {
  // numeric valued members only
  const nums = Object.values(SP).filter((v) => typeof v === 'number') as number[];
  return nums.filter((n) => n !== SP.SPONSOR_LIST_SELECT_PANEL).map((n) => n as SP);
}

function stableSortByEnumOrder(entries: PanelEntry[]): PanelEntry[] {
  const order = allEnumPanels();
  const idx = new Map<number, number>();
  order.forEach((id, i) => idx.set(id, i));
  return [...entries].sort((a, b) => (idx.get(a.panel)! - idx.get(b.panel)!));
}

/**
 * Validate and normalize any persisted panel tree into a flat, consistent list.
 * - Drops unknown/invalid IDs and SPONSOR_LIST_SELECT_PANEL (never persist)
 * - Coerces visible to boolean
 * - Dedupes by keeping the last occurrence per panel
 * - Adds any missing known panels with visible=false
 * - Reconciles overlays: if >1 visible, keep the first in MAIN_OVERLAY_GROUP order
 */
export function validateAndNormalizePanelTree(input: unknown): NormalizeResult {
  const notes: string[] = [];
  let repaired = false;

  // Accept nested array of nodes or already-flat arrays
  let flat: PanelEntry[] = [];
  try {
    const maybeArr = Array.isArray(input) ? input : (typeof input === 'object' && input !== null ? (input as any) : []);
    flat = flatten(maybeArr as any[]);
  } catch {
    // fall back to defaults below
    notes.push('parse-error: could not flatten, seeding defaults');
    repaired = true;
  }

  const knownPanels = new Set<number>(allEnumPanels());

  // Drop invalid panels, coerce boolean
  const filtered = (flat || []).filter((e) => knownPanels.has(e.panel)).map((e) => ({ panel: e.panel, visible: !!e.visible }));
  if (filtered.length !== (flat || []).length) {
    repaired = true;
    notes.push('dropped-unknown-panels');
  }

  // Deduplicate (keep last)
  const deduped = uniqLastByPanel(filtered);
  if (deduped.length !== filtered.length) {
    repaired = true;
    notes.push('deduped-duplicate-ids');
  }

  // Add missing known panels default=false
  const byId = new Map<number, PanelEntry>(deduped.map((e) => [e.panel, e]));
  for (const id of knownPanels) {
    if (!byId.has(id)) {
      byId.set(id, { panel: id as SP, visible: false });
      repaired = true;
      notes.push(`added-missing-${SP[id as SP]}`);
    }
  }
  let normalized = Array.from(byId.values());

  // Overlay reconciliation: keep first visible in MAIN_OVERLAY_GROUP order
  const overlayOrder = MAIN_OVERLAY_GROUP.slice();
  const visibleOverlays = overlayOrder.filter((id) => byId.get(id)?.visible);
  if (visibleOverlays.length > 1) {
    const keep = visibleOverlays[0];
    for (const id of overlayOrder) {
      const entry = byId.get(id);
      if (!entry) continue;
      entry.visible = id === keep;
    }
    normalized = Array.from(byId.values());
    repaired = true;
    notes.push(`overlay-reconcile: kept ${SP[keep]}`);
  }

  // Stable sort for deterministic diffs
  normalized = stableSortByEnumOrder(normalized);

  return { normalized, repaired, notes };
}

// Helper to produce a normalized default when storage is empty/corrupt
export function normalizedDefault(): NormalizeResult {
  const flatDefault = flatten(defaultSpCoinPanelTree as any);
  return validateAndNormalizePanelTree(flatDefault);
}
