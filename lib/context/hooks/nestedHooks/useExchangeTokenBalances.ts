// File: lib/context/hooks/nestedHooks/useExchangeTokenBalances.ts

'use client';

import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';

import { useExchangeContext } from '../useExchangeContext';
import { useWagmiERC20TokenBalanceOf } from '@/lib/hooks/wagmi/wagmiERC20ClientRead';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_USE_EXCHANGE_BALANCES === 'true';
const debugLog = createDebugLogger('useExchangeTokenBalances', DEBUG_ENABLED, LOG_TIME);

export const useExchangeTokenBalances = (hydrated: boolean) => {
  const { address } = useAccount();
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const buyToken = exchangeContext.tradeData.buyTokenContract;
  const sellToken = exchangeContext.tradeData.sellTokenContract;

  const buyTokenAddress = buyToken?.address as Address | undefined;
  const sellTokenAddress = sellToken?.address as Address | undefined;

  const buyBalance = useWagmiERC20TokenBalanceOf(
    address as Address | undefined,
    buyTokenAddress
  );

  const sellBalance = useWagmiERC20TokenBalanceOf(
    address as Address | undefined,
    sellTokenAddress
  );

  const effectRunCount = useRef(0);

  useEffect(() => {
    effectRunCount.current++;
    debugLog.log(`🔁 useEffect triggered: count = ${effectRunCount.current}`);
    debugLog.log('🧪 hydrated:', hydrated);
    debugLog.log('📦 address:', address);
    debugLog.log('🎯 buyToken:', buyToken?.symbol, buyTokenAddress);
    debugLog.log('🎯 sellToken:', sellToken?.symbol, sellTokenAddress);
    debugLog.log('💰 buyBalance:', buyBalance);
    debugLog.log('💰 sellBalance:', sellBalance);

    if (!hydrated) {
      debugLog.warn('⛔ Not hydrated — skipping balance update');
      return;
    }

    if (!address) {
      debugLog.warn('⛔ No connected address — skipping balance update');
      return;
    }

    const updates: Partial<typeof exchangeContext['tradeData']> = {};

    if (
      buyToken?.address &&
      buyBalance !== undefined &&
      (buyToken.balance === undefined || buyBalance !== buyToken.balance)
    ) {
      debugHookChange('buyToken.balance', buyToken.balance, buyBalance);

      updates.buyTokenContract = {
        ...buyToken,
        address: buyToken.address,
        balance: buyBalance,
      };
    }

    if (
      sellToken?.address &&
      sellBalance !== undefined &&
      (sellToken.balance === undefined || sellBalance !== sellToken.balance)
    ) {
      debugHookChange('sellToken.balance', sellToken.balance, sellBalance);

      updates.sellTokenContract = {
        ...sellToken,
        address: sellToken.address,
        balance: sellBalance,
      };
    }

    if (Object.keys(updates).length > 0) {
      debugLog.log('💾 Applying token balance updates to context');
      setExchangeContext((prev) => {
        const next = structuredClone(prev);
        next.tradeData = {
          ...next.tradeData,
          ...updates,
        };
        return next;
      });
    } else {
      debugLog.log('⏩ No token balance changes to apply');
    }
  }, [
    hydrated,
    address,
    buyTokenAddress,
    sellTokenAddress,
    buyBalance,
    sellBalance,
    buyToken?.balance,
    sellToken?.balance,
    setExchangeContext,
  ]);
};
