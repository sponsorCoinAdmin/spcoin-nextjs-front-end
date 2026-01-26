// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useAgentAccounts.ts
'use client';

import type { spCoinAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useAgentAccounts(): [
  spCoinAccount[],
  (next: spCoinAccount[] | ((prev: spCoinAccount[]) => spCoinAccount[])) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const agents = accounts.agentAccounts ?? [];

  const setAgents = (
    next: spCoinAccount[] | ((prev: spCoinAccount[]) => spCoinAccount[]),
  ) => {
    setAccounts((prev) => {
      const current = prev.agentAccounts ?? [];
      const updated =
        typeof next === 'function'
          ? (next as (p: spCoinAccount[]) => spCoinAccount[])(current)
          : next;
      return {
        ...prev,
        agents: updated,
      };
    });
  };

  return [agents, setAgents];
}
