// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useAgentAccount.ts
'use client';

import type { WalletAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useAgentAccount(): [
  WalletAccount | undefined,
  (next: WalletAccount | undefined) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const agent = accounts.agentAccount;

  const setAgent = (next: WalletAccount | undefined) => {
    setAccounts((prev) => ({
      ...prev,
      agentAccount: next,
    }));
  };

  return [agent, setAgent];
}
