'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';

import { useExchangeContext } from '../useExchangeContext';
import { useWagmiERC20TokenBalanceOf } from '@/lib/wagmi/wagmiERC20ClientRead';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useDebugHookChange } from '@/lib/hooks/useDebugHookChange';
import { useDidHydrate } from '@/lib/hooks/useDidHydrate';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_BALANCES === 'true';
const debugLog = createDebugLogger('useExchangeTokenBalances', DEBUG_ENABLED, LOG_TIME);

export const useExchangeTokenBalances = () => {
  const { address } = useAccount();
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const logChange = useDebugHookChange(); // ✅ use descriptive function name
  const didHydrate = useDidHydrate();

  const buyToken = exchangeContext.tradeData.buyTokenContract;
  const sellToken = exchangeContext.tradeData.sellTokenContract;

  const buyBalance = useWagmiERC20TokenBalanceOf(address as Address, buyToken?.address as Address);
  const sellBalance = useWagmiERC20TokenBalanceOf(address as Address, sellToken?.address as Address);

  useEffect(() => {
    if (!address) return;

    const updates: Partial<typeof exchangeContext['tradeData']> = {};

    if (buyToken?.address && buyBalance !== undefined && buyBalance !== buyToken.balance) {
      logChange('buyToken.balance', buyToken.balance, buyBalance);
      updates.buyTokenContract = {
        ...buyToken,
        balance: buyBalance,
      };
    }

    if (sellToken?.address && sellBalance !== undefined && sellBalance !== sellToken.balance) {
      logChange('sellToken.balance', sellToken.balance, sellBalance);
      updates.sellTokenContract = {
        ...sellToken,
        balance: sellBalance,
      };
    }

    if (Object.keys(updates).length > 0) {
      debugLog.log('💾 Applying token balance updates to context');
      setExchangeContext(prev => {
        const next = structuredClone(prev);
        next.tradeData = {
          ...next.tradeData,
          ...updates,
        };
        return next;
      });
    }
  }, [address, buyBalance, sellBalance, buyToken, sellToken, setExchangeContext, didHydrate]);
};
