// File: app/(menu)/Test/Tabs/ExchangeContext/hooks/useVirtualPanelTree.ts
'use client';

import { useMemo } from 'react';
import type { ExchangeContext } from '@/lib/structure';
import { buildVirtualTree } from '../structure/derived/buildVirtualTree';

export function useVirtualPanelTree(ctx: ExchangeContext | undefined) {
  const flat = (ctx as any)?.settings?.mainPanelNode;
  return useMemo(() => buildVirtualTree(flat), [flat]);
}
