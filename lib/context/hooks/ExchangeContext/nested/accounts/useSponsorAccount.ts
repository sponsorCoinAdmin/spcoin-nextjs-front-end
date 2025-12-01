// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useSponsorAccount.ts
'use client';

import type { WalletAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useSponsorAccount(): [
  WalletAccount | undefined,
  (next: WalletAccount | undefined) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const sponsor = accounts.sponsorAccount;

  const setSponsor = (next: WalletAccount | undefined) => {
    setAccounts((prev) => ({
      ...prev,
      sponsorAccount: next,
    }));
  };

  return [sponsor, setSponsor];
}
