// File: lib/hooks/wagmi/ERC20/useBalanceOf.ts
'use client';

import { useEffect } from 'react';
import { useBalance } from 'wagmi';
import type { Address } from 'viem';
import { useExchangeContext } from '@/lib/context/hooks';

type UseBalanceOfParams = {
  /** Whose balance to read; defaults to connected account */
  user?: Address;
  /** ERC-20 token address; omit for native */
  token?: Address;
  /** Gate the query */
  enabled?: boolean;
  /** If true, mirror into accounts.activeAccount.balance when user === connected */
  mirrorActiveAccount?: boolean;
};

export function useBalanceOf({
  user,
  token,
  enabled = true,
  mirrorActiveAccount = false,
}: UseBalanceOfParams) {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const connected = exchangeContext.accounts?.activeAccount?.address as Address | undefined;
  const userAddress = (user ?? connected) as Address | undefined;

  const isEnabled = Boolean(userAddress) && enabled;

  // wagmi v2: React Query options go under `query`
  const result = useBalance({
    address: userAddress,
    token, // undefined => native
    chainId: exchangeContext?.network?.chainId,
    query: { enabled: isEnabled },
  });

  // Optional: mirror into activeAccount.balance snapshot (for debug/persistence)
  useEffect(() => {
    if (!mirrorActiveAccount) return;
    if (!userAddress || !connected) return;
    if (userAddress.toLowerCase() !== connected.toLowerCase()) return;

    const v = result.data?.value;
    if (v === undefined) return;

    setExchangeContext((prev) => {
      const ca = prev.accounts?.activeAccount;
      if (!ca || ca.balance === v) return prev;
      return {
        ...prev,
        accounts: {
          ...prev.accounts,
          activeAccount: { ...ca, balance: v },
        },
      };
    });
  }, [mirrorActiveAccount, userAddress, connected, result.data?.value, setExchangeContext]);

  return result;
}
