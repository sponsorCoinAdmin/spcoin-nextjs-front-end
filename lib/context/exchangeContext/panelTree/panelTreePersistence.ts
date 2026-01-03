// File: @/lib/context/exchangeContext/panelTree/panelTreePersistence.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

export type PanelEntry = {
  panel: SP_COIN_DISPLAY;
  visible: boolean;
  name?: string;
};

/**
 * Persisted node shapes we may encounter (read-compat):
 * - canonical (stage 3): { id, visible, name }
 * - legacy:             { panel, visible, name }
 * - older experimental: { displayTypeId, visible, name }
 * - optional nesting:   { children: [...] }
 */
export type PersistedPanelNode = {
  id?: number;
  panel?: number;
  displayTypeId?: number;
  visible?: boolean;
  name?: string;
  children?: PersistedPanelNode[];
};

/**
 * Stable name resolver.
 */
export function panelName(id: number) {
  return (SP_COIN_DISPLAY as any)?.[id] ?? String(id);
}

/**
 * ✅ Single source-of-truth ID resolver (read-compat):
 * Accepts canonical + legacy shapes.
 *
 * Supports:
 * - { id }
 * - { panel }
 * - { displayTypeId } (older experimental)
 */
export function panelIdOf(v: unknown): number | null {
  const anyV = v as any;
  const raw = anyV?.id ?? anyV?.panel ?? anyV?.displayTypeId;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

/**
 * Flattens the persisted tree into a de-duplicated flat list.
 * Stage 3:
 * - Tree shape is no longer authoritative; visibility is.
 * - First occurrence of a panel id wins (deterministic).
 *
 * ✅ Supports:
 * - persisted nodes using { id }
 * - legacy nodes using { panel }
 * - older experimental nodes using { displayTypeId }
 * - nested children (optional)
 */
export function flattenPanelTree(
  nodes: PersistedPanelNode[] | undefined,
  known: Set<number>,
): PanelEntry[] {
  if (!Array.isArray(nodes)) return [];

  const out: PanelEntry[] = [];

  const walk = (ns: PersistedPanelNode[]) => {
    for (const n of ns) {
      const id = panelIdOf(n);
      if (id == null) continue;
      if (!known.has(id)) continue;

      const name =
        typeof (n as any)?.name === 'string' && (n as any).name.length > 0
          ? (n as any).name
          : panelName(id);

      out.push({
        panel: id as SP_COIN_DISPLAY,
        visible: !!(n as any)?.visible,
        name,
      });

      if (Array.isArray((n as any)?.children) && (n as any).children.length) {
        walk((n as any).children as PersistedPanelNode[]);
      }
    }
  };

  walk(nodes);

  // De-dupe by panel id (keep first occurrence)
  const seen = new Set<number>();
  return out.filter((e) => {
    const k = Number(e.panel);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Converts a flat list to a visibility map.
 * Missing panels are implicitly false.
 */
export function toVisibilityMap(list: PanelEntry[]): Record<number, boolean> {
  const m: Record<number, boolean> = {};
  for (const e of list) {
    m[Number(e.panel)] = !!e.visible;
  }
  return m;
}

/**
 * Ensures a panel exists in the flat list.
 * Does NOT change visibility.
 */
export function ensurePanelPresent(
  list: PanelEntry[],
  panel: SP_COIN_DISPLAY,
): PanelEntry[] {
  if (list.some((e) => Number(e.panel) === Number(panel))) return list;
  return [
    ...list,
    {
      panel,
      visible: false,
      name: panelName(panel),
    },
  ];
}

/**
 * Writes the flat list back to persisted context form.
 *
 * Stage 3:
 * - Persistence is a normalized flat list
 * - No stack or tree reconstruction
 *
 * ✅ Canonical write: { id, visible, name }
 * ✅ Back-compat: also write { panel } until all readers are migrated.
 *
 * ✅ Required fix:
 * - NEVER write/keep a legacy root `displayStack` here. (Single source of truth is settings.displayStack)
 *   If a stale root field exists on prevCtx, remove it in the returned object to prevent re-persisting it.
 */
export function writeFlatTree(prevCtx: any, next: PanelEntry[]) {
  const normalized = next.map((e) => {
    const id = Number(e.panel);
    return {
      id: id as SP_COIN_DISPLAY, // canonical
      panel: id as SP_COIN_DISPLAY, // back-compat (remove later)
      visible: !!e.visible,
      name: e.name ?? panelName(id),
    };
  });

  // strip any stale legacy root displayStack so it can't be re-persisted
  const { displayStack: _legacyRootDisplayStack, ...rest } = prevCtx ?? {};

  return {
    ...rest,
    settings: {
      ...(rest?.settings ?? {}),
      spCoinPanelTree: normalized,
    },
  };
}
