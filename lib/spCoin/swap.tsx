'use client';

import { useBuyAmount, useExchangeContext, useSellAmount } from '@/lib/context/hooks/contextHooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { useAccount } from 'wagmi';
import { useCallback } from 'react';

const useSwapFunctions = () => {
  const { exchangeContext } = useExchangeContext();
  const tradeData = exchangeContext.tradeData;
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const { address, isConnected } = useAccount();

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
