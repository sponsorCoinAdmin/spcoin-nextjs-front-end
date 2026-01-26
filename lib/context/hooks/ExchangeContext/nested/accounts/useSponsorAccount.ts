// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useSponsorAccount.ts
'use client';

import type { spCoinAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useSponsorAccount(): [
  spCoinAccount | undefined,
  (next: spCoinAccount | undefined) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const sponsor = accounts.sponsorAccount;

  const setSponsor = (next: spCoinAccount | undefined) => {
    setAccounts((prev) => ({
      ...prev,
      sponsorAccount: next,
    }));
  };

  return [sponsor, setSponsor];
}
