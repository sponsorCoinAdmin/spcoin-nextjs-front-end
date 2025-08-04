'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { useCallback } from 'react';

const useSwapFunctions = () => {
  const { exchangeContext } = useExchangeContext();
  const tradeData = exchangeContext.tradeData;

  const doSwap = useCallback(async () => {
    console.log(`SWAP:` + stringifyBigInt(tradeData));
    alert(`SWAP`);
  }, [tradeData]);

  const swap = useCallback(async () => {
    await doSwap();
    return 'SWAP'; // Optional return value to match expected signature
  }, [doSwap]);

  return swap;
};

export default useSwapFunctions;
