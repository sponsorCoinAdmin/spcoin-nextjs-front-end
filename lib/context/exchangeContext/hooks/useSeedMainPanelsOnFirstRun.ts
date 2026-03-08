// File: lib/context/exchangeContext/hooks/useSeedMainPanelsOnFirstRun.ts
'use client';

import { useEffect } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { loadInitialPanelNodeDefaults } from '@/lib/structure/exchangeContext/defaults/loadInitialPanelNodeDefaults';

export function useSeedMainPanelsOnFirstRun() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  useEffect(() => {
    const hasList = Array.isArray((exchangeContext as any)?.settings?.spCoinPanelTree);
    if (hasList) return; // respect existing state

    const seed = loadInitialPanelNodeDefaults();
    setExchangeContext(
      (prev) => ({
        ...prev,
        settings: { ...(prev as any)?.settings, spCoinPanelTree: seed },
      }),
      'seed:spCoinPanelTree:first-run'
    );
  }, [exchangeContext, setExchangeContext]);
}
