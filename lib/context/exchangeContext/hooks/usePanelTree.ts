// File: lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';

const TRADING = SP_COIN_DISPLAY.TRADING_STATION_PANEL;

type PanelEntry = {
  panel: SP_COIN_DISPLAY;
  visible: boolean;
};

const isPanelArray = (x: any): x is PanelEntry[] =>
  Array.isArray(x) &&
  x.every(
    (n) =>
      n &&
      typeof n === 'object' &&
      typeof (n as any).panel === 'number' &&
      typeof (n as any).visible === 'boolean'
  );

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // Authoritative list of main overlays (array-only, no legacy/object tree)
  const list = useMemo<PanelEntry[]>(
    () =>
      isPanelArray((exchangeContext as any)?.settings?.mainPanelNode)
        ? ((exchangeContext as any).settings.mainPanelNode as PanelEntry[])
        : [],
    [exchangeContext]
  );

  // Keep exactly one visible panel across MAIN_OVERLAY_GROUP (fallback to TRADING)
  useEffect(() => {
    if (!list.length) return;

    const count = MAIN_OVERLAY_GROUP.reduce(
      (n, id) => n + (list.find((e) => e.panel === id)?.visible ? 1 : 0),
      0
    );
    if (count === 1) return;

    setExchangeContext(
      (prev) => {
        const current = isPanelArray((prev as any)?.settings?.mainPanelNode)
          ? ((prev as any).settings.mainPanelNode as PanelEntry[])
          : [];
        if (!current.length) return prev;

        const next = current.map((e) =>
          MAIN_OVERLAY_GROUP.includes(e.panel)
            ? { ...e, visible: e.panel === TRADING }
            : e
        );

        return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
      },
      'usePanelTree:reconcile'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  /* ───────────────────────────── queries ───────────────────────────── */

  const isVisible = useCallback(
    (panel: SP_COIN_DISPLAY) => !!list.find((e) => e.panel === panel)?.visible,
    [list]
  );

  /**
   * Read-only children for display only.
   * We do NOT mutate or seed any relationships here; if settings.panelChildren
   * is absent, this returns an empty array so your UI shows “(empty)”.
   */
  const getPanelChildren = useCallback(
    (parent: SP_COIN_DISPLAY): SP_COIN_DISPLAY[] => {
      const map = (((exchangeContext as any)?.settings ?? {}).panelChildren ??
        {}) as Record<number, number[]>;
      const arr = map[parent] ?? [];
      return Array.from(new Set(arr)).filter((id) => id !== parent) as SP_COIN_DISPLAY[];
    },
    [exchangeContext]
  );

  /* ───────────────────────────── actions ───────────────────────────── */

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      setExchangeContext(
        (prev) => {
          const current = isPanelArray((prev as any)?.settings?.mainPanelNode)
            ? ((prev as any).settings.mainPanelNode as PanelEntry[])
            : [];
          if (!current.length) return prev;

          const next = current.map((e) =>
            MAIN_OVERLAY_GROUP.includes(e.panel)
              ? { ...e, visible: e.panel === panel }
              : e
          );

          return { ...prev, settings: { ...(prev as any).settings, mainPanelNode: next } };
        },
        'usePanelTree:openPanel'
      );
    },
    [setExchangeContext]
  );

  // Radio overlays can't be "closed" from here; no-op keeps behavior predictable
  const closePanel = useCallback((_panel: SP_COIN_DISPLAY) => {}, []);

  /* ───────────────────────────── derived ───────────────────────────── */

  const activeMainOverlay = useMemo<SP_COIN_DISPLAY>(() => {
    for (const id of MAIN_OVERLAY_GROUP) {
      if (list.find((e) => e.panel === id)?.visible) return id;
    }
    return TRADING;
  }, [list]);

  const isTokenScrollVisible = useMemo(
    () =>
      !!list.find((e) => e.panel === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL)?.visible ||
      !!list.find((e) => e.panel === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL)?.visible,
    [list]
  );

  return {
    // state
    activeMainOverlay,

    // queries
    isVisible,
    isTokenScrollVisible,
    getPanelChildren, // display-only; empty unless settings.panelChildren exists

    // actions
    openPanel,
    closePanel,
  };
}
