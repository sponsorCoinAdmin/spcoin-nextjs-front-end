// File: lib/context/exchangeContext/hooks/usePanelTree.ts

'use client';

import { useMemo, useCallback } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure/enums/spCoinDisplay';
import { defaultMainPanelNode } from '@/lib/structure/exchangeContext/constants/defaultPanelTree';
import type { MainPanelNode } from '@/lib/structure/exchangeContext/types/PanelNode';
import {
  flattenPanels,
  findNode,
  toggleVisibility,
  openOnly,
} from '@/lib/context/exchangeContext/helpers/panelTree';
import { useExchangeContext } from '@/lib/context/hooks';

type SetMainPanelNodeFn = (
  updater: (prev: MainPanelNode | null) => MainPanelNode | null,
  hookName?: string
) => void;

// Incremental compatibility: provider may not expose setMainPanelNode yet.
type CtxMaybePanels = {
  exchangeContext: any;
  setMainPanelNode?: SetMainPanelNodeFn;
};

export function usePanelTree() {
  const ctx = useExchangeContext() as CtxMaybePanels;

  // Prefer the context node; fall back to a stable default so UI doesn’t crash pre-hydration.
  const root: MainPanelNode =
    (ctx.exchangeContext?.mainPanelNode as MainPanelNode | undefined) ?? defaultMainPanelNode;

  // Use provider setter if available; otherwise a safe no-op (until wired).
  const setMainPanelNode: SetMainPanelNodeFn =
    ctx.setMainPanelNode ??
    (() => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[usePanelTree] setMainPanelNode is not available yet. Wire it in ExchangeProvider to enable updates.');
      }
    });

  // Derived helpers
  const flat = useMemo(() => flattenPanels(root), [root]);

  const get = useCallback((panel: SP_COIN_DISPLAY) => findNode(root, panel), [root]);

  const toggle = useCallback(
    (panel: SP_COIN_DISPLAY, hookName = 'usePanelTree:toggle') => {
      setMainPanelNode((prev) => {
        const base = prev ?? defaultMainPanelNode;
        return toggleVisibility(base, panel);
      }, hookName);
    },
    [setMainPanelNode]
  );

  const openOnlyIn = useCallback(
    (panel: SP_COIN_DISPLAY, group?: SP_COIN_DISPLAY[], hookName = 'usePanelTree:openOnlyIn') => {
      setMainPanelNode((prev) => {
        const base = prev ?? defaultMainPanelNode;
        return openOnly(base, panel, group);
      }, hookName);
    },
    [setMainPanelNode]
  );

  const replace = useCallback(
    (nextRoot: MainPanelNode, hookName = 'usePanelTree:replace') => {
      setMainPanelNode(() => nextRoot, hookName);
    },
    [setMainPanelNode]
  );

  return { root, flat, get, toggle, openOnlyIn, replace };
}
