// File: app/(menu)/Test/Tabs/ExchangeContext/structure/derived/buildVirtualTree.ts
import { SP_COIN_DISPLAY as SPCD } from '@/lib/structure';
import type { PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import { ROOTS, CHILDREN } from '../constants/panelTreeSchema';
import type { VirtualPanelNode } from '../types/virtualPanel';

type FlatMap = Map<SPCD, PanelNode>;

function toFlatMap(flat: PanelNode[] | undefined): FlatMap {
  const m = new Map<SPCD, PanelNode>();
  if (!Array.isArray(flat)) return m;
  for (const n of flat) {
    if (typeof n?.panel === 'number') m.set(n.panel as SPCD, n);
  }
  return m;
}

function makeNode(id: SPCD, flat: FlatMap): VirtualPanelNode {
  const present = flat.has(id);
  const visible = present ? !!flat.get(id)!.visible : false;
  const childrenIds = CHILDREN[id] ?? [];
  return {
    id,
    name: (SPCD as any)[id] ?? String(id),
    visible,
    children: childrenIds.map((cid) => makeNode(cid, flat)),
  };
}

export function buildVirtualTree(flat: PanelNode[] | undefined): {
  tree: VirtualPanelNode[];
  orphans: SPCD[];
  missing: SPCD[];
} {
  const flatMap = toFlatMap(flat);

  // Build declared tree from schema
  const tree = ROOTS.map((rid) => makeNode(rid, flatMap));

  // Compute coverage: all ids referenced by schema (roots + children)
  const referenced = new Set<SPCD>();
  const mark = (id: SPCD) => {
    if (referenced.has(id)) return;
    referenced.add(id);
    (CHILDREN[id] ?? []).forEach(mark);
  };
  ROOTS.forEach(mark);

  // Missing = referenced by schema but not present in flat
  const missing: SPCD[] = Array.from(referenced).filter((id) => !flatMap.has(id));

  // Orphans = present in flat but never referenced by schema
  const orphans: SPCD[] = Array.from(flatMap.keys()).filter((id) => !referenced.has(id));

  return { tree, orphans, missing };
}
