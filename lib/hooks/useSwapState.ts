import { Address } from 'viem';
import { useEffect, useState } from 'react';
import { exchangeContext } from '../context';
import { isTokenAddress, isNetworkAddress, isWrappedNetworkAddress } from '../network/utils';
import { SWAP_STATE } from '@/lib/structure/types';

export const useSwapState = () => {
  const [swapState, setSwapState] = useState<SWAP_STATE>(SWAP_STATE.UNDEFINED);

  useEffect(() => {
    getSwapState(exchangeContext.tradeData.sellTokenContract?.address, exchangeContext.tradeData.buyTokenContract?.address);
  }, [exchangeContext.tradeData.sellTokenContract?.address, exchangeContext.tradeData.buyTokenContract?.address]);

  const getSwapState = (sellTokenAddress:Address|undefined, buyTokenAddress:Address|undefined) => {
    if (isTokenAddress(sellTokenAddress)) {
      if (isTokenAddress(buyTokenAddress))
        setSwapState(SWAP_STATE.SWAP)
      else
        if (isNetworkAddress(buyTokenAddress))
          if (isWrappedNetworkAddress(sellTokenAddress))
            setSwapState(SWAP_STATE.UNWRAP)
          else
          setSwapState(SWAP_STATE.SWAP_TO_NETWORK_TOKEN_UNWRAP)
    } else if (isNetworkAddress(sellTokenAddress)){
        if (isWrappedNetworkAddress(buyTokenAddress))
          setSwapState(SWAP_STATE.WRAP)
        else
        setSwapState(SWAP_STATE.WRAP_TO_NETWORK_TOKEN_SWAP)
      } else
        setSwapState(SWAP_STATE.UNDEFINED)
  }

  return swapState;
};