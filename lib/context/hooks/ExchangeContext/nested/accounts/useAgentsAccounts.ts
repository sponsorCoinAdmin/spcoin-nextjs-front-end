// File: @/lib/context/hooks/ExchangeContext/nested/accounts/useAgentAccounts.ts
'use client';

import type { WalletAccount } from '@/lib/structure';
import { useAccounts } from '../useAccounts';

export function useAgentAccounts(): [
  WalletAccount[],
  (next: WalletAccount[] | ((prev: WalletAccount[]) => WalletAccount[])) => void,
] {
  const [accounts, setAccounts] = useAccounts();
  const agents = accounts.agentAccounts ?? [];

  const setAgents = (
    next: WalletAccount[] | ((prev: WalletAccount[]) => WalletAccount[]),
  ) => {
    setAccounts((prev) => {
      const current = prev.agentAccounts ?? [];
      const updated =
        typeof next === 'function'
          ? (next as (p: WalletAccount[]) => WalletAccount[])(current)
          : next;
      return {
        ...prev,
        agents: updated,
      };
    });
  };

  return [agents, setAgents];
}
