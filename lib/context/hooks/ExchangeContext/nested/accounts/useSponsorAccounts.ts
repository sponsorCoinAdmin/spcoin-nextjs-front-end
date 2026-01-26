// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useSponsorAccounts.ts
'use client';

import type { spCoinAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useSponsorAccounts(): [
  spCoinAccount[],
  (next: spCoinAccount[] | ((prev: spCoinAccount[]) => spCoinAccount[])) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const sponsors = accounts.sponsorAccounts ?? [];

  const setSponsors = (
    next: spCoinAccount[] | ((prev: spCoinAccount[]) => spCoinAccount[]),
  ) => {
    setAccounts((prev) => {
      const current = prev.sponsorAccounts ?? [];
      const updated =
        typeof next === 'function'
          ? (next as (p: spCoinAccount[]) => spCoinAccount[])(current)
          : next;
      return {
        ...prev,
        sponsors: updated,
      };
    });
  };

  return [sponsors, setSponsors];
}
