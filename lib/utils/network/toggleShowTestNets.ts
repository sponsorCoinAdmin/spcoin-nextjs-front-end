// File: @/lib/utils/network/toggleShowTestNets.ts

import type { ExchangeContext } from '@/lib/structure';

export const toggleShowTestNetsUpdater = (
  prev: ExchangeContext,
): ExchangeContext => ({
  ...prev,
  settings: {
    ...prev.settings,
    showTestNets: !Boolean(prev.settings?.showTestNets),
  },
});

