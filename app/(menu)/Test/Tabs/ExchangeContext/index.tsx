//File: app/(menu)/Test/Tabs/FSMTracePaExchangeContextnel/index.tsx

'use client';
'use client';

import { useMemo } from 'react';
import JsonInspector from '@/components/shared/JsonInspector';
import { normalizeContextDisplay } from '../utils';
import type { ExchangeContext } from '@/lib/structure';

type Props = {
  exchangeContext: ExchangeContext;
  collapsedKeys: string[];
  updateCollapsedKeys: (next: string[]) => void;
};

export default function ExchangeContextTab({
  exchangeContext,
  collapsedKeys,
  updateCollapsedKeys,
}: Props) {
  const normalizedCtx = useMemo(
    () => normalizeContextDisplay(exchangeContext),
    [exchangeContext]
  );

  return (
    <JsonInspector
      data={normalizedCtx}
      collapsedKeys={collapsedKeys}
      updateCollapsedKeys={updateCollapsedKeys}
    />
  );
}
