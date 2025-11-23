// File: @/lib/context/exchangeContext/helpers/panelBootstrap.ts
'use client';

import { useEffect, useRef } from 'react';

import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { PanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import {
  defaultSpCoinPanelTree,
  flattenPanelTree,
  NON_PERSISTED_PANELS,
  MUST_INCLUDE_ON_BOOT,
} from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/registry/panelRegistry';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

/* --------------------------------- Version --------------------------------- */

export const PANEL_SCHEMA_VERSION = 2;

/* ------------------------------- PanelBootstrap ---------------------------- */

/**
 * Post-mount bootstrap which ensures a MAIN_OVERLAY_GROUP panel is selected.
 * If nothing is active, it opens TRADING_STATION_PANEL once on mount.
 */
export function PanelBootstrap() {
  const { activeMainOverlay, openPanel } = usePanelTree();
  const did = useRef(false);

  useEffect(() => {
    if (did.current) return;
    did.current = true;

    // Only pick a default if nothing is selected (rare),
    // so we never override a persisted choice.
    if (activeMainOverlay == null) {
      queueMicrotask(() =>
        openPanel(
          SP_COIN_DISPLAY.TRADING_STATION_PANEL,
          'ExchangeProvider:PanelBootstrap(openPanel)',
        ),
      );
    }
  }, [activeMainOverlay, openPanel]);

  return null;
}

/* --------------------------- Panel helper functions ------------------------ */

const panelName = (id: number) => SP_COIN_DISPLAY[id] ?? String(id);

/** Type guard for a “flat” panel list in settings.spCoinPanelTree. */
export const isMainPanels = (x: any): x is PanelNode[] =>
  Array.isArray(x) &&
  x.length > 0 &&
  x.every(
    (n) =>
      n &&
      typeof n === 'object' &&
      typeof (n as any).panel === 'number' &&
      typeof (n as any).visible === 'boolean',
  );

/** Ensure a single node has a valid name and visible flag. */
const ensurePanelName = (n: PanelNode): PanelNode => ({
  panel: n.panel,
  name: n.name || panelName(n.panel),
  visible: !!n.visible,
  children: Array.isArray(n.children)
    ? n.children.map(ensurePanelName)
    : undefined,
});

/** Apply ensurePanelName to an entire in-memory tree. */
export const ensurePanelNamesInMemory = (panels: PanelNode[]): PanelNode[] =>
  panels.map(ensurePanelName);

/**
 * Start from authored defaults, merge persisted, enforce required and order.
 * This is the top-level “repair” used on boot.
 */
export function repairPanels(
  persisted: Array<{ panel: number; name?: string; visible?: boolean }> | undefined,
): PanelNode[] {
  // Start from authored defaults, excluding non-persisted IDs
  const defaults = flattenPanelTree(defaultSpCoinPanelTree).filter(
    (p) => !NON_PERSISTED_PANELS.has(p.panel as SP_COIN_DISPLAY),
  );

  // Index defaults by id
  const byId = new Map<number, PanelNode>();
  for (const p of defaults) {
    byId.set(p.panel, {
      panel: p.panel,
      name: p.name || panelName(p.panel),
      visible: !!p.visible,
    });
  }

  // Merge any persisted visibility/name (if provided)
  if (Array.isArray(persisted)) {
    for (const p of persisted) {
      const id = p?.panel;
      if (!Number.isFinite(id) || NON_PERSISTED_PANELS.has(id as SP_COIN_DISPLAY))
        continue;

      const prev = byId.get(id);
      if (prev) {
        if (typeof p.visible === 'boolean') prev.visible = p.visible;
        if (p.name && p.name !== prev.name) prev.name = p.name;
      } else {
        byId.set(id, {
          panel: id,
          name: p.name || panelName(id),
          visible: !!p.visible,
        });
      }
    }
  }

  // Ensure required panels exist
  for (const [id, vis] of MUST_INCLUDE_ON_BOOT) {
    if (!byId.has(id)) {
      byId.set(id, {
        panel: id,
        name: panelName(id),
        visible: vis,
      });
    }
  }

  // Preserve default order, then append any extras
  const defaultOrder = defaults.map((d) => d.panel);
  const extras = [...byId.keys()].filter((id) => !defaultOrder.includes(id));
  const orderedIds = [...defaultOrder, ...extras];

  return orderedIds.map((id) => byId.get(id)!);
}

/** Drop non-persisted items (safety no-op if they’re already excluded). */
export function dropNonPersisted(panels: PanelNode[]): PanelNode[] {
  return panels.filter(
    (p) => !NON_PERSISTED_PANELS.has(p.panel as SP_COIN_DISPLAY),
  );
}

/** Ensure required panels exist; apply default visibility only when absent. */
export function ensureRequiredPanels(
  panels: PanelNode[],
  required: ReadonlyArray<readonly [number, boolean]>,
): PanelNode[] {
  const byId = new Map(panels.map((p) => [p.panel, { ...p }]));
  for (const [id, vis] of required) {
    if (!byId.has(id)) {
      byId.set(id, {
        panel: id,
        name: panelName(id),
        visible: vis,
      });
    }
  }
  return [...byId.values()];
}

/** Zero/one visible overlay; prefer TRADING_STATION_PANEL if multiple. */
export function reconcileOverlayVisibility(flat: PanelNode[]): PanelNode[] {
  const isOverlay = (id: number) =>
    MAIN_OVERLAY_GROUP.includes(id as SP_COIN_DISPLAY);

  const visible = flat.filter((n) => isOverlay(n.panel) && n.visible);
  if (visible.length <= 1) return flat;

  const preferred =
    visible.find((n) => n.panel === SP_COIN_DISPLAY.TRADING_STATION_PANEL) ??
    visible[0];

  return flat.map((n) =>
    isOverlay(n.panel)
      ? { ...n, visible: n.panel === preferred.panel }
      : n,
  );
}
