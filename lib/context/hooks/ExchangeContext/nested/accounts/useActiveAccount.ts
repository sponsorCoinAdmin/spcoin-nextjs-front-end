// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useActiveAccount.ts
'use client';

import type { WalletAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useActiveAccount(): [
  WalletAccount | undefined,
  (next: WalletAccount | undefined) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const active = accounts.activeAccount;

  const setActive = (next: WalletAccount | undefined) => {
    setAccounts((prev) => ({
      ...prev,
      activeAccount: next,
    }));
  };

  return [active, setActive];
}
