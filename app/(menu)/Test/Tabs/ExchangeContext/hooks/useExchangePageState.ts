// File: app/(menu)/Test/Tabs/ExchangeContext/hooks/useExchangePageState.ts
'use client';

import { useCallback } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { useExchangeContext } from '@/lib/context/hooks';

export function useExchangePageState() {
  const { state, setState } = usePageState();
  const { exchangeContext } = useExchangeContext();

  const pageAny: any = state.page?.exchangePage ?? {};
  const expandContext: boolean = pageAny.expandContext ?? false;

  const setExpandContext = useCallback(
    (expanded: boolean) => {
      setState((prev: any) => ({
        ...prev,
        page: {
          ...prev?.page,
          exchangePage: {
            ...(prev?.page?.exchangePage ?? {}),
            expandContext: expanded,
          },
        },
      }));
    },
    [setState]
  );

  const hideContext = useCallback(() => {
    setState((prev: any) => ({
      ...prev,
      page: {
        ...prev?.page,
        exchangePage: {
          ...(prev?.page?.exchangePage ?? {}),
          showContext: false,
        },
      },
    }));
  }, [setState]);

  const logContext = useCallback(() => {
    console.log('📦 Log Context (tab):', stringifyBigInt(exchangeContext));
  }, [exchangeContext]);

  return { expandContext, setExpandContext, hideContext, logContext };
}
