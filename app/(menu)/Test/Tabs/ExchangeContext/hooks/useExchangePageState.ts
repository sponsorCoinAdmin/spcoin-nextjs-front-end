// File: app/(menu)/Test/Tabs/ExchangeContext/hooks/useExchangePageState.ts
'use client';

import { useCallback } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';

export function useExchangePageState() {
  const { state, setState } = usePageState();

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

  // No-op logger to preserve API without console output
  const logContext = useCallback(() => {}, []);

  return { expandContext, setExpandContext, hideContext, logContext };
}
