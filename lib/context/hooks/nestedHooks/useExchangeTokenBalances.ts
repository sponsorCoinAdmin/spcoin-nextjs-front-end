'use client'

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useExchangeContext } from '../useExchangeContext';
import { useWagmiERC20TokenBalanceOf } from '@/lib/wagmi/wagmiERC20ClientRead';
import { Address } from 'viem';

export const useExchangeTokenBalances = () => {
  const { address } = useAccount();
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const buyToken = exchangeContext.tradeData.buyTokenContract;
  const sellToken = exchangeContext.tradeData.sellTokenContract;

  const buyBalance = useWagmiERC20TokenBalanceOf(address as Address, buyToken?.address as Address);
  const sellBalance = useWagmiERC20TokenBalanceOf(address as Address, sellToken?.address as Address);

  useEffect(() => {
    const updates: Partial<typeof exchangeContext['tradeData']> = {};

    if (buyToken?.address && buyToken) {
      updates.buyTokenContract = {
        ...buyToken,
        balance: buyBalance ?? 0n,
      };
    }

    if (sellToken?.address && sellToken) {
      updates.sellTokenContract = {
        ...sellToken,
        balance: sellBalance ?? 0n,
      };
    }

    if (Object.keys(updates).length > 0) {
      setExchangeContext(prev => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          ...updates,
        },
      }));
    }
  }, [buyBalance, sellBalance, buyToken, sellToken, setExchangeContext]);
};
