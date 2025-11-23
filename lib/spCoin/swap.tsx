// File: lib/hooks/useSwapFunctions.ts
'use client';

import { useCallback } from 'react';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_BUTTON === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';

const debugLog = createDebugLogger('useSwapFunctions', DEBUG_ENABLED, LOG_TIME);

const useSwapFunctions = () => {
  const { exchangeContext } = useExchangeContext();
  const tradeData = exchangeContext.tradeData;

  const doSwap = useCallback(async () => {
    debugLog.log?.('SWAP tradeData:', stringifyBigInt(tradeData));
    if (typeof window !== 'undefined') {
      alert('SWAP');
    }
  }, [tradeData]);

  const swap = useCallback(async () => {
    debugLog.log?.('swap() invoked');
    await doSwap();
    return 'SWAP'; // Optional return value to match expected signature
  }, [doSwap]);

  return swap;
};

export default useSwapFunctions;
