// File: app/(menu)/Test/Tabs/ExchangeContext/hooks/useVirtualPanelTree.ts
'use client';

import { useMemo } from 'react';
import type { ExchangeContext , SP_COIN_DISPLAY as SP } from '@/lib/structure';

import {
  ROOTS,
  CHILDREN,
} from '@/lib/structure/exchangeContext/registry/panelRegistry';

export type VirtualPanelNode = {
  id: SP;
  visible: boolean;
  children: VirtualPanelNode[];
};

export function useVirtualPanelTree(ctx: ExchangeContext | undefined) {
  const flat = (ctx as any)?.settings?.spCoinPanelTree as
    | { panel: SP; visible: boolean }[]
    | undefined;

  return useMemo(() => {
    // visibility from persisted flat state
    const vis = new Map<number, boolean>();
    if (Array.isArray(flat)) {
      for (const n of flat) {
        if (n && typeof n.panel === 'number') vis.set(n.panel, !!n.visible);
      }
    }

    // schema traversal helpers
    const build = (id: SP): VirtualPanelNode => ({
      id,
      visible: !!vis.get(id),
      children: (CHILDREN[id] ?? []).map(build),
    });

    const tree: VirtualPanelNode[] = ROOTS.map(build);

    // collect all schema ids
    const schemaIds = new Set<number>();
    const walk = (ns: VirtualPanelNode[]) => {
      for (const n of ns) {
        schemaIds.add(n.id);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(tree);

    // diagnostics: orphans (in flat, not in schema), missing (in schema, not in flat)
    const orphans: SP[] = Array.from(vis.keys())
      .filter((id) => !schemaIds.has(id))
      .map((id) => id as SP);

    const missing: SP[] = Array.from(schemaIds)
      .filter((id) => !vis.has(id))
      .map((id) => id as SP);

    return { tree, orphans, missing };
  }, [flat]);
}
