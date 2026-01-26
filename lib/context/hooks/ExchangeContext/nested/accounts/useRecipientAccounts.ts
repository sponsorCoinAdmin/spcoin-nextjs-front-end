// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useRecipientAccounts.ts
'use client';

import type { spCoinAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useRecipientAccounts(): [
  spCoinAccount[],
  (next: spCoinAccount[] | ((prev: spCoinAccount[]) => spCoinAccount[])) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const recipients = accounts.recipientAccounts ?? [];

  const setRecipients = (
    next: spCoinAccount[] | ((prev: spCoinAccount[]) => spCoinAccount[]),
  ) => {
    setAccounts((prev) => {
      const current = prev.recipientAccounts ?? [];
      const updated =
        typeof next === 'function'
          ? (next as (p: spCoinAccount[]) => spCoinAccount[])(current)
          : next;
      return {
        ...prev,
        recipients: updated,
      };
    });
  };

  return [recipients, setRecipients];
}
