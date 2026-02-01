// Dir: @/components/views/RadioOverlayPanels/AccountListRewardsPanel
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SP_COIN_DISPLAY } from '@/lib/structure';

import { LS_CHEVRON_OPEN_KEY } from './constants';
import { setPanelVisibleEverywhere } from './utils';

export function useChevronOpenPending(cfgChevronOpen: boolean, ctx: any, panel: SP_COIN_DISPLAY) {
  const [chevronOpenPending, setChevronOpenPending] = useState(false);
  const didHydrateChevronRef = useRef(false);

  useEffect(() => {
    setChevronOpenPending(cfgChevronOpen);

    if (didHydrateChevronRef.current) return;
    didHydrateChevronRef.current = true;

    if (typeof window === 'undefined') return;

    const lsOpen = window.localStorage.getItem(LS_CHEVRON_OPEN_KEY);
    const hasLs = lsOpen === 'true' || lsOpen === 'false';
    if (!hasLs) return;

    const resolvedOpen = lsOpen === 'true';
    setChevronOpenPending(resolvedOpen);
    setPanelVisibleEverywhere(ctx, panel, resolvedOpen);
  }, [cfgChevronOpen, ctx, panel]);

  const effectiveChevronOpenPending = cfgChevronOpen || chevronOpenPending;

  const setGlobalChevronOpen = useCallback(
    (open: boolean) => {
      setChevronOpenPending(open);

      try {
        if (typeof window !== 'undefined') window.localStorage.setItem(LS_CHEVRON_OPEN_KEY, String(open));
      } catch {
        // no-op
      }

      setPanelVisibleEverywhere(ctx, panel, open);
    },
    [ctx, panel],
  );

  return { effectiveChevronOpenPending, setGlobalChevronOpen };
}
