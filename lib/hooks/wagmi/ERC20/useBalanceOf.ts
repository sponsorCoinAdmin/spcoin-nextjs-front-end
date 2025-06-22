'use client';

import { useEffect, useMemo } from 'react';
import { useBalance } from 'wagmi';
import { Address } from 'viem';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils';
import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('useBalanceOf', DEBUG_ENABLED, LOG_TIME);

/**
 * ✅ useBalanceOf
 * Fetches balance for connected account or specified token and updates context.
 */
export function useBalanceOf({ address, token }: { address: Address; token?: Address }) {
  const { exchangeContext, setExchangeContext: updateExchangeContext } = useExchangeContext();

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
      const oldBalance = exchangeContext.accounts?.connectedAccount?.balance;

      if (oldBalance !== undefined && oldBalance !== fetchedBalance) {
        const reason = `reason: useBalanceOf updating connectedAccount.balance from ${oldBalance} to ${fetchedBalance}`;
        debugLog.log(`🪙 ${reason}`);

        updateExchangeContext((prev) => {
          const ca = prev.accounts?.connectedAccount;
          if (!ca) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              connectedAccount: {
                ...ca,
                balance: fetchedBalance,
              },
            },
          };
        }, reason);
      }
    }
  }, [result.data?.value, balanceParams?.address, connectedAccountAddress]);

  return result;
}

/**
 * ✅ setConnectedAccountBalance (manual setter)
 */
export function setConnectedAccountBalance(balance: bigint) {
  const { setExchangeContext: updateExchangeContext, exchangeContext } = useExchangeContext();
  const oldBalance = exchangeContext.accounts?.connectedAccount?.balance;
  const reason = `reason: setConnectedAccountBalance updating connectedAccount.balance from ${oldBalance} to ${balance}`;

  debugLog.log(`🪙 ${reason}`);

  updateExchangeContext((prev) => {
    const ca = prev.accounts?.connectedAccount;
    if (!ca) return prev;
    return {
      ...prev,
      accounts: {
        ...prev.accounts,
        connectedAccount: {
          ...ca,
          balance,
        },
      },
    };
  }, reason);
}
