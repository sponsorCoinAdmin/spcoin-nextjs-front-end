// File: lib/hooks/wagmi/ERC20/useBalanceOf.ts
'use client';

import { useEffect, useMemo } from 'react';
import { useBalance, useAppChainId } from 'wagmi';
import { Address } from 'viem';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils';
import { useExchangeContext } from '@/lib/context/hooks';

/**
 * ✅ useBalanceOf
 * 
 * A wrapper around Wagmi’s `useBalance` that:
 * - Uses `exchangeContext.accounts.connectedAccount.address` if the passed address is `NATIVE_TOKEN_ADDRESS`
 * - Falls back to normal ERC-20 usage if a `token` is specified
 * - Updates connected account balance in context if the fetch is for that account
 *
 * @param address — target address to fetch balance for (or `NATIVE_TOKEN_ADDRESS`)
 * @param token — optional ERC-20 token contract address (ignored if native)
 * @returns Wagmi balance result
 *
 * @example Native token (ETH, MATIC, etc.)
 * ```tsx
 * import { useBalanceOf } from '@/lib/hooks/wagmi/ERC20/useBalanceOf';
 * import { NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils';
 * 
 * const { data, isLoading } = useBalanceOf({ address: NATIVE_TOKEN_ADDRESS });
 * ```
 * 
 * @example ERC-20 token balance
 * ```tsx
 * import { useBalanceOf } from '@/lib/hooks/wagmi/ERC20/useBalanceOf';
 * 
 * const userAddress = '0x123...';
 * const tokenAddress = '0xabc...';
 * 
 * const { data, isLoading } = useBalanceOf({ address: userAddress, token: tokenAddress });
 * ```
 */
export function useBalanceOf({ address, token }: { address: Address; token?: Address }) {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const isNative = address === NATIVE_TOKEN_ADDRESS;
  const connectedAccountAddress = exchangeContext.accounts?.connectedAccount?.address;

  const balanceParams = useMemo(() => {
    if (isNative && connectedAccountAddress) {
      return { address: connectedAccountAddress as Address };
    }
    if (!isNative && address) {
      return { address, token };
    }
    return null;
  }, [isNative, connectedAccountAddress, address, token]);

  const result = balanceParams
    ? useBalance({ ...balanceParams })
    : { data: undefined, isLoading: false, isError: false };

  useEffect(() => {
    const fetchedAddress = balanceParams?.address;
    const fetchedBalance = result.data?.value;

    if (
      fetchedAddress &&
      fetchedBalance !== undefined &&
      fetchedAddress.toLowerCase() === connectedAccountAddress?.toLowerCase()
    ) {
      setExchangeContext((prev) => {
        const ca = prev.accounts?.connectedAccount;
        if (!ca) return prev;
        return {
          ...prev,
          accounts: {
            ...prev.accounts,
            connectedAccount: {
              ...ca,
              balance: fetchedBalance,
              name: ca.name ?? '',
              symbol: ca.symbol ?? '',
              type: ca.type ?? '',
              website: ca.website ?? '',
              description: ca.description ?? '',
              status: ca.status ?? '',
              address: ca.address,
              logoURL: ca.logoURL,
            },
          },
        };
      });
    }
  }, [result.data?.value, balanceParams?.address, connectedAccountAddress, setExchangeContext]);

  return result;
}

/**
 * ✅ setConnectedAccountBalance
 *
 * Direct setter for `exchangeContext.accounts.connectedAccount.balance`
 *
 * @param balance — bigint balance value
 *
 * @example
 * ```ts
 * import { setConnectedAccountBalance } from '@/lib/hooks/wagmi/ERC20/useBalanceOf';
 * 
 * setConnectedAccountBalance(1234567890000000000n); // Sets balance to 1.23456789 ETH
 * ```
 */
export function setConnectedAccountBalance(balance: bigint) {
  const { setExchangeContext } = useExchangeContext();

  setExchangeContext((prev) => {
    const ca = prev.accounts?.connectedAccount;
    if (!ca) return prev;
    return {
      ...prev,
      accounts: {
        ...prev.accounts,
        connectedAccount: {
          ...ca,
          balance,
          name: ca.name ?? '',
          symbol: ca.symbol ?? '',
          type: ca.type ?? '',
          website: ca.website ?? '',
          description: ca.description ?? '',
          status: ca.status ?? '',
          address: ca.address,
          logoURL: ca.logoURL,
        },
      },
    };
  });
}
