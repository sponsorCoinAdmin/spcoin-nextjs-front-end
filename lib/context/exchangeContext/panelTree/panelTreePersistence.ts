// File: @/lib/context/exchangeContext/panelTree/panelTreePersistence.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

export type PanelEntry = {
  panel: SP_COIN_DISPLAY;
  visible: boolean;
  name?: string;
};

/**
 * Stable name resolver.
 */
export function panelName(id: number) {
  return (SP_COIN_DISPLAY as any)?.[id] ?? String(id);
}

/**
 * Flattens the persisted tree into a de-duplicated flat list.
 * Stage 3:
 * - Tree shape is no longer authoritative; visibility is.
 * - First occurrence of a panel id wins (deterministic).
 */
export function flattenPanelTree(
  nodes: any[] | undefined,
  known: Set<number>,
): PanelEntry[] {
  if (!Array.isArray(nodes)) return [];

  const out: PanelEntry[] = [];

  const walk = (ns: any[]) => {
    for (const n of ns) {
      const id =
        typeof n?.panel === 'number' && known.has(n.panel)
          ? (n.panel as number)
          : null;

      if (id == null) continue;

      const name =
        typeof n?.name === 'string' && n.name.length > 0
          ? n.name
          : panelName(id);

      out.push({
        panel: id as SP_COIN_DISPLAY,
        visible: !!n?.visible,
        name,
      });

      if (Array.isArray(n?.children) && n.children.length) {
        walk(n.children);
      }
    }
  };

  walk(nodes);

  // De-dupe by panel id (keep first occurrence)
  const seen = new Set<number>();
  return out.filter((e) => {
    if (seen.has(e.panel)) return false;
    seen.add(e.panel);
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
    m[e.panel] = !!e.visible;
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
  if (list.some((e) => e.panel === panel)) return list;
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
 */
export function writeFlatTree(prevCtx: any, next: PanelEntry[]) {
  const normalized = next.map((e) => ({
    panel: e.panel,
    visible: !!e.visible,
    name: e.name ?? panelName(e.panel),
  }));

  return {
    ...prevCtx,
    settings: {
      ...(prevCtx?.settings ?? {}),
      spCoinPanelTree: normalized,
    },
  };
}
