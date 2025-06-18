// File: lib/context/hooks/nestedHooks/useExchangeTokenBalances.ts

'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';

import { useExchangeContext } from '../useExchangeContext';
import { useBalanceOf } from '@/lib/hooks/wagmi/ERC20/useBalanceOf';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_BALANCES === 'true';
const debugLog = createDebugLogger('useExchangeTokenBalances', DEBUG_ENABLED, LOG_TIME);

function balancesAreEqual(a?: bigint, b?: bigint): boolean {
  if (a === b) return true;
  return a?.toString() === b?.toString();
}

export const useExchangeTokenBalances = () => {
  const { address } = useAccount();
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const buyToken = exchangeContext.tradeData.buyTokenContract;
  const sellToken = exchangeContext.tradeData.sellTokenContract;

  const buyResult = useBalanceOf({ address: address as Address, token: buyToken?.address as Address });
  const sellResult = useBalanceOf({ address: address as Address, token: sellToken?.address as Address });

  const buyBalance = buyResult.data?.value;
  const sellBalance = sellResult.data?.value;

  useEffect(() => {
    if (!address) return;

    const newTradeData = { ...exchangeContext.tradeData };
    let hasChanged = false;

    if (
      buyToken?.address &&
      buyBalance !== undefined &&
      !balancesAreEqual(buyToken.balance, buyBalance)
    ) {
      debugHookChange('buyToken.balance', buyToken.balance, buyBalance);
      newTradeData.buyTokenContract = { ...buyToken, balance: buyBalance };
      hasChanged = true;
    }

    if (
      sellToken?.address &&
      sellBalance !== undefined &&
      !balancesAreEqual(sellToken.balance, sellBalance)
    ) {
      debugHookChange('sellToken.balance', sellToken.balance, sellBalance);
      newTradeData.sellTokenContract = { ...sellToken, balance: sellBalance };
      hasChanged = true;
    }

    if (hasChanged) {
      debugLog.log('💾 Committing updated token balances to context');
      setExchangeContext(prev => ({
        ...prev,
        tradeData: newTradeData,
      }));
    }
  }, [address, buyBalance, sellBalance, buyToken, sellToken, setExchangeContext]);
};
