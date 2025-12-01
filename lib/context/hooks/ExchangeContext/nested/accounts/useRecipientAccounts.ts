// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useRecipientAccounts.ts
'use client';

import type { WalletAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useRecipientAccounts(): [
  WalletAccount[],
  (next: WalletAccount[] | ((prev: WalletAccount[]) => WalletAccount[])) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const recipients = accounts.recipientAccounts ?? [];

  const setRecipients = (
    next: WalletAccount[] | ((prev: WalletAccount[]) => WalletAccount[]),
  ) => {
    setAccounts((prev) => {
      const current = prev.recipientAccounts ?? [];
      const updated =
        typeof next === 'function'
          ? (next as (p: WalletAccount[]) => WalletAccount[])(current)
          : next;
      return {
        ...prev,
        recipients: updated,
      };
    });
  };

  return [recipients, setRecipients];
}
