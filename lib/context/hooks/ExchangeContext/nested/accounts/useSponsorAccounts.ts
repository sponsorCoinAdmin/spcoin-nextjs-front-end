// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useSponsorAccounts.ts
'use client';

import type { WalletAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useSponsorAccounts(): [
  WalletAccount[],
  (next: WalletAccount[] | ((prev: WalletAccount[]) => WalletAccount[])) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const sponsors = accounts.sponsorAccounts ?? [];

  const setSponsors = (
    next: WalletAccount[] | ((prev: WalletAccount[]) => WalletAccount[]),
  ) => {
    setAccounts((prev) => {
      const current = prev.sponsorAccounts ?? [];
      const updated =
        typeof next === 'function'
          ? (next as (p: WalletAccount[]) => WalletAccount[])(current)
          : next;
      return {
        ...prev,
        sponsors: updated,
      };
    });
  };

  return [sponsors, setSponsors];
}
