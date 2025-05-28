// File: lib/context/hooks/nestedHooks/useExchangeBalances.ts

import { useExchangeContext } from '../useExchangeContext';
import { useBalance, useAccount } from 'wagmi';
import { useEffect } from 'react';
import { Address } from 'viem';

/**
 * Hook to fetch and update the sell token balance directly in exchangeContext.tradeData.sellTokenContract.balance
 */
export const useSellBalance = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { address } = useAccount();

  const token = exchangeContext.tradeData.sellTokenContract;
  const tokenAddress: Address | undefined = token?.symbol === 'ETH' ? undefined : token?.address;

  const balanceResult = useBalance({
    address,
    token: tokenAddress,
    chainId: token?.chainId,
  });

  useEffect(() => {
    if (balanceResult.data?.value != null && token) {
      setExchangeContext((prev) => {
        const prevToken = prev.tradeData.sellTokenContract;
        if (!prevToken) return prev;
        return {
          ...prev,
          tradeData: {
            ...prev.tradeData,
            sellTokenContract: {
              ...prevToken,
              balance: balanceResult.data!.value,
            },
          },
        };
      });
    }
  }, [balanceResult.data?.value]);

  return balanceResult;
};

/**
 * Hook to fetch and update the buy token balance directly in exchangeContext.tradeData.buyTokenContract.balance
 */
export const useBuyBalance = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { address } = useAccount();

  const token = exchangeContext.tradeData.buyTokenContract;
  const tokenAddress: Address | undefined = token?.symbol === 'ETH' ? undefined : token?.address;

  const balanceResult = useBalance({
    address,
    token: tokenAddress,
    chainId: token?.chainId,
  });

  useEffect(() => {
    if (balanceResult.data?.value != null && token) {
      setExchangeContext((prev) => {
        const prevToken = prev.tradeData.buyTokenContract;
        if (!prevToken) return prev;
        return {
          ...prev,
          tradeData: {
            ...prev.tradeData,
            buyTokenContract: {
              ...prevToken,
              balance: balanceResult.data!.value,
            },
          },
        };
      });
    }
  }, [balanceResult.data?.value]);

  return balanceResult;
};

export const useExchangeBalances = () => {
  const sell = useSellBalance();
  const buy = useBuyBalance();
  return {
    sellBalanceResult: sell,
    buyBalanceResult: buy,
    updateBalances: (tokenContract: any, address: string) => {
      // placeholder – you can customize if needed
    },
  };
};
