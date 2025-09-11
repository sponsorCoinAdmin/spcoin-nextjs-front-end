// File: lib/context/exchangeContext/hooks/usePanelTree.ts
'use client';

import { useCallback, useMemo } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import type { MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';

const OVERLAY_GROUP: SP_COIN_DISPLAY[] = [
  SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL,
  SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL,
  SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,
  SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL,
];

const TRADING = SP_COIN_DISPLAY.TRADING_STATION_PANEL;

function clone<T>(o: T): T {
  return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

function findNode(root: MainPanelNode | undefined, panel: SP_COIN_DISPLAY): any | null {
  if (!root) return null;
  if (root.panel === panel) return root;
  for (const c of root.children || []) {
    const n = findNode(c as any, panel);
    if (n) return n;
  }
  return null;
}

export function usePanelTree() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const root = exchangeContext.settings?.mainPanelNode as MainPanelNode | undefined;

  const isVisible = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      const n = findNode(root, panel);
      return !!n?.visible;
    },
    [root]
  );

  const showPanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      setExchangeContext((prev) => {
        const r = prev.settings?.mainPanelNode as MainPanelNode | undefined;
        if (!r) return prev;
        const next = clone(r);
        const n = findNode(next, panel);
        if (n) n.visible = true;
        return { ...prev, settings: { ...prev.settings, mainPanelNode: next } };
      }, 'usePanelTree:showPanel');
    },
    [setExchangeContext]
  );

  const hidePanel = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      setExchangeContext((prev) => {
        const r = prev.settings?.mainPanelNode as MainPanelNode | undefined;
        if (!r) return prev;
        const next = clone(r);
        const n = findNode(next, panel);
        if (n) n.visible = false;
        return { ...prev, settings: { ...prev.settings, mainPanelNode: next } };
      }, 'usePanelTree:hidePanel');
    },
    [setExchangeContext]
  );

  /** Radio behavior for overlays */
  const openOverlay = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      setExchangeContext((prev) => {
        const r = prev.settings?.mainPanelNode as MainPanelNode | undefined;
        if (!r) return prev;
        const next = clone(r);

        // hide all overlays
        for (const p of OVERLAY_GROUP) {
          const n = findNode(next, p);
          if (n) n.visible = false;
        }
        // show requested overlay
        const target = findNode(next, panel);
        if (target) target.visible = true;

        // hide trading station
        const trading = findNode(next, TRADING);
        if (trading) trading.visible = false;

        return { ...prev, settings: { ...prev.settings, mainPanelNode: next } };
      }, 'usePanelTree:openOverlay');
    },
    [setExchangeContext]
  );

  const closeOverlays = useCallback(() => {
    setExchangeContext((prev) => {
      const r = prev.settings?.mainPanelNode as MainPanelNode | undefined;
      if (!r) return prev;
      const next = clone(r);

      for (const p of OVERLAY_GROUP) {
        const n = findNode(next, p);
        if (n) n.visible = false;
      }
      const trading = findNode(next, TRADING);
      if (trading) trading.visible = true;

      return { ...prev, settings: { ...prev.settings, mainPanelNode: next } };
    }, 'usePanelTree:closeOverlays');
  }, [setExchangeContext]);

  const isTokenScrollVisible = useMemo(
    () => isVisible(SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL) || isVisible(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL),
    [isVisible]
  );

  return {
    isVisible,
    showPanel,
    hidePanel,
    openOverlay,
    closeOverlays,
    // small conveniences used by MainTradingPanel
    isTokenScrollVisible,
  };
}
