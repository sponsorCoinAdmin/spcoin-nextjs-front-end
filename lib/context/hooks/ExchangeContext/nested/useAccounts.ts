// File: @/lib/context/hooks/ExchangeContext/nested/useAccounts.ts
'use client';

import { useCallback } from 'react';
import { useExchangeContext } from '../useExchangeContext';

// Infer the accounts type from the context
type Accounts = ReturnType<typeof useExchangeContext>['exchangeContext']['accounts'];

type AccountsUpdater = Accounts | ((prev: Accounts) => Accounts);

export function useAccounts(): [Accounts, (next: AccountsUpdater) => void] {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const accounts = exchangeContext.accounts as Accounts;

  const setAccounts = useCallback(
    (next: AccountsUpdater) => {
      setExchangeContext(
        (prev) => {
          const current = prev.accounts as Accounts;
          const updated =
            typeof next === 'function'
              ? (next as (p: Accounts) => Accounts)(current)
              : next;

          return {
            ...prev,
            accounts: updated,
          };
        },
        'useAccounts:setAccounts',
      );
    },
    [setExchangeContext],
  );

  return [accounts, setAccounts];
}
