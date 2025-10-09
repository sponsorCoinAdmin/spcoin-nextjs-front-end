// File: lib/structure/exchangeContext/defaults/loadInitialPanelNodeDefaults.ts
'use client';

import type { PanelNode, SpCoinPanelTree } from '@/lib/structure/exchangeContext/types/PanelNode';
import { defaultSpCoinPanelTree } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
import { PANEL_DEFS } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

// Flatten the nested default tree into a flat {panel, name, visible}[] list.
function flatten(nodes: PanelNode[] | undefined, out: PanelNode[] = []): PanelNode[] {
  if (!Array.isArray(nodes)) return out;
  for (const n of nodes) {
    if (!n || typeof n.panel !== 'number') continue;
    // push parent
    out.push({ panel: n.panel, name: n.name, visible: !!n.visible });
    // walk children
    if (Array.isArray(n.children) && n.children.length) flatten(n.children, out);
  }
  // de-dupe by panel id (first write wins — preserves your default visibilities)
  const seen = new Set<number>();
  return out.filter((e) => (seen.has(e.panel) ? false : (seen.add(e.panel), true)));
}

/**
 * Seed panels from the authored default tree, then append any registry-defined
 * panels that are *missing*. Never overwrite the tree’s visibilities.
 * Excludes SP.SPONSOR_LIST_SELECT_PANEL (never persist).
 */
export function loadInitialPanelNodeDefaults(): SpCoinPanelTree {
  // 1) start from your authored tree (authoritative defaults)
  const flat = flatten(defaultSpCoinPanelTree as unknown as PanelNode[]);

  // 2) add any registry panels that are missing (don’t override existing)
  const present = new Set(flat.map((n) => n.panel));
  const toAppend: PanelNode[] = [];
  for (const def of PANEL_DEFS) {
    const id = def.id as SP;
    if (id === SP.SPONSOR_LIST_SELECT_PANEL) continue; // never persist
    if (!present.has(id)) {
      toAppend.push({
        panel: id,
        name: SP[id] ?? String(id),
        // defaultVisible is used ONLY for panels that your tree didn’t seed
        visible: !!def.defaultVisible,
      });
    }
  }

  // 3) return as a flat list with names + visibilities (no children in persistence)
  return [...flat, ...toAppend].map((n) => ({
    panel: n.panel,
    name: n.name ?? SP[n.panel] ?? String(n.panel),
    visible: !!n.visible,
  }));
}
