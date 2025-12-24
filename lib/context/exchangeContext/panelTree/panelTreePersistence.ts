// File: @/lib/context/exchangeContext/panelTree/panelTreePersistence.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

export type PanelEntry = {
  panel: SP_COIN_DISPLAY;
  visible: boolean;
  name?: string;
};

export function panelName(id: number) {
  return (SP_COIN_DISPLAY as any)[id] ?? String(id);
}

export function flattenPanelTree(
  nodes: any[] | undefined,
  known: Set<number>,
): PanelEntry[] {
  if (!Array.isArray(nodes)) return [];
  const out: PanelEntry[] = [];

  const walk = (ns: any[]) => {
    for (const n of ns) {
      const id = typeof n?.panel === 'number' ? (n.panel as number) : NaN;
      if (!Number.isFinite(id) || !known.has(id)) continue;

      const name =
        typeof n?.name === 'string' && n.name.length > 0
          ? (n.name as string)
          : panelName(id);

      out.push({ panel: id as SP_COIN_DISPLAY, visible: !!n.visible, name });
      if (Array.isArray(n.children) && n.children.length) walk(n.children);
    }
  };

  walk(nodes);

  // De-dupe by panel id (keep first occurrence)
  const seen = new Set<number>();
  return out.filter((e) => (seen.has(e.panel) ? false : (seen.add(e.panel), true)));
}

export function toVisibilityMap(list: PanelEntry[]): Record<number, boolean> {
  const m: Record<number, boolean> = {};
  for (const e of list) m[e.panel] = !!e.visible;
  return m;
}

export function ensurePanelPresent(
  list: PanelEntry[],
  panel: SP_COIN_DISPLAY,
): PanelEntry[] {
  return list.some((e) => e.panel === panel)
    ? list
    : [...list, { panel, visible: false, name: panelName(panel) }];
}

export function writeFlatTree(prevCtx: any, next: PanelEntry[]) {
  const withNames = next.map((e) => ({
    panel: e.panel,
    visible: !!e.visible,
    name: e.name ?? panelName(e.panel),
  }));

  return {
    ...prevCtx,
    settings: { ...(prevCtx?.settings ?? {}), spCoinPanelTree: withNames },
  };
}
