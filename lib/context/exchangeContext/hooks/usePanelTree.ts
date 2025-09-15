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

  // Authoritative list of main overlays (array-only, flat, childless)
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

    const visibleCount = MAIN_OVERLAY_GROUP.reduce(
      (n, id) => n + (list.find((e) => e.panel === id)?.visible ? 1 : 0),
      0
    );
    if (visibleCount === 1) return;

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

  /* ───────────────────────────── actions ───────────────────────────── */

  const openPanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      setExchangeContext(
        (prev) => {
          const current = isPanelArray((prev as any)?.settings?.mainPanelNode)
            ? ((prev as any).settings.mainPanelNode as PanelEntry[])
            : [];
          if (!current.length) return prev;

          // If it's already the active one, skip changing anything
          const alreadyActive = current.some(
            (e) => MAIN_OVERLAY_GROUP.includes(e.panel) && e.panel === panel && e.visible
          );
          if (alreadyActive) return prev;

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

  // Radio overlays can't be "closed" from here; keep as a no-op for predictability
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

    // actions
    openPanel,
    closePanel,
  };
}
