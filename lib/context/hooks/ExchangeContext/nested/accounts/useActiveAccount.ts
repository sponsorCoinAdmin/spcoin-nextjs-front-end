// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useActiveAccount.ts
'use client';

import type { spCoinAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useActiveAccount(): [
  spCoinAccount | undefined,
  (next: spCoinAccount | undefined) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const active = accounts.activeAccount;

  const setActive = (next: spCoinAccount | undefined) => {
    setAccounts((prev) => ({
      ...prev,
      activeAccount: next,
    }));
  };

  return [active, setActive];
}
