// File: lib/context/hooks/nestedHooks/useExchangeBalances.ts

'use client';

import { useExchangeContext } from '../useExchangeContext';
import { useBalance, useAccount } from 'wagmi';
import { useEffect, useMemo, useRef } from 'react';
import { Address } from 'viem';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { isNativeToken } from '@/lib/utils/isNativeToken';
import { TokenContract } from '@/lib/structure/types';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_USE_EXCHANGE_BALANCES === 'true';
const debugLog = createDebugLogger('ExchangeBalances', DEBUG_ENABLED, LOG_TIME);

const useManagedBalance = (
  token: TokenContract | undefined,
  updateTokenInContext: (balance: bigint) => void,
  type: 'sell' | 'buy'
) => {
  const { address } = useAccount();

  const tokenAddress: Address | undefined = useMemo(() => {
    if (!token) return undefined;
    return isNativeToken(token.address, token.chainId) ? undefined : token.address;
  }, [token]);

  const chainId = token?.chainId;

  const balanceResult = useBalance({
    address,
    token: tokenAddress,
    chainId,
  });

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastArgs = useRef<{
    address?: Address;
    tokenAddress?: Address;
    chainId?: number;
  } | null>(null);
  const prevBalanceRef = useRef<bigint | null>(null);

  useEffect(() => {
    const argsChanged =
      lastArgs.current?.address !== address ||
      lastArgs.current?.tokenAddress !== tokenAddress ||
      lastArgs.current?.chainId !== chainId;

    if (!argsChanged) return;

    lastArgs.current = { address, tokenAddress, chainId };

    debugLog.log(`⚖️ Requesting ${type} token balance`, {
      walletAddress: address,
      tokenSymbol: token?.symbol,
      tokenAddress,
      chainId,
    });

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      if (balanceResult.data?.value != null && token) {
        const newBalance = balanceResult.data.value;

        if (newBalance !== prevBalanceRef.current) {
          debugLog.log(`✅ Received ${type} token balance`, {
            value: newBalance.toString(),
            symbol: balanceResult.data.symbol,
          });

          prevBalanceRef.current = newBalance;
          updateTokenInContext(newBalance);
        }
      }
    }, 500);
  }, [address, tokenAddress, chainId, balanceResult.data?.value]);
};

export const useSellBalance = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const token = exchangeContext.tradeData.sellTokenContract;

  useManagedBalance(token, (balance) => {
    setExchangeContext((prev) => {
      const prevToken = prev.tradeData.sellTokenContract;
      if (!prevToken || prevToken.address !== token?.address) return prev;
      return {
        ...prev,
        tradeData: {
          ...prev.tradeData,
          sellTokenContract: {
            ...prevToken,
            balance,
          },
        },
      };
    });
  }, 'sell');
};

export const useBuyBalance = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const token = exchangeContext.tradeData.buyTokenContract;

  useManagedBalance(token, (balance) => {
    setExchangeContext((prev) => {
      const prevToken = prev.tradeData.buyTokenContract;
      if (!prevToken || prevToken.address !== token?.address) return prev;
      return {
        ...prev,
        tradeData: {
          ...prev.tradeData,
          buyTokenContract: {
            ...prevToken,
            balance,
          },
        },
      };
    });
  }, 'buy');
};

export const useExchangeBalances = () => {
  useSellBalance();
  useBuyBalance();

  return {
    updateBalances: () => {
      // Optionally reset cache or force refresh in the future
    },
  };
};
