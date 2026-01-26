// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useAgentAccount.ts
'use client';

import type { spCoinAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useAgentAccount(): [
  spCoinAccount | undefined,
  (next: spCoinAccount | undefined) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const agent = accounts.agentAccount;

  const setAgent = (next: spCoinAccount | undefined) => {
    setAccounts((prev) => ({
      ...prev,
      agentAccount: next,
    }));
  };

  return [agent, setAgent];
}
