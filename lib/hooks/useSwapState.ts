import { Address } from 'viem';
import { useEffect, useState } from 'react';
import { exchangeContext } from '../context';
import { isTokenAddress, isNetworkAddress, isWrappedNetworkAddress } from '../network/utils';
import { SWAP_TYPE } from '@/lib/structure/types';

export const useSwapState = () => {
  const [swapType, setSwapType] = useState<SWAP_TYPE>(SWAP_TYPE.UNDEFINED);

  useEffect(() => {
    exchangeContext.tradeData.swapType = swapType;
  }, [swapType]);
 
  useEffect(() => {
    getSwapState(exchangeContext.tradeData.sellTokenContract?.address, exchangeContext.tradeData.buyTokenContract?.address);
  }, [exchangeContext.tradeData.sellTokenContract?.address, exchangeContext.tradeData.buyTokenContract?.address]);

  const getSwapState = (sellTokenAddress:Address|undefined, buyTokenAddress:Address|undefined) => {
    if (isTokenAddress(sellTokenAddress)) {
      if (isTokenAddress(buyTokenAddress))
        setSwapType(SWAP_TYPE.SWAP)
      else
        if (isNetworkAddress(buyTokenAddress))
          if (isWrappedNetworkAddress(sellTokenAddress))
            setSwapType(SWAP_TYPE.UNWRAP)
          else
          setSwapType(SWAP_TYPE.SWAP_UNWRAP)
    } else if (isNetworkAddress(sellTokenAddress)){
        if (isWrappedNetworkAddress(buyTokenAddress))
          setSwapType(SWAP_TYPE.WRAP)
        else
        setSwapType(SWAP_TYPE.WRAP_SWAP)
      } else
        setSwapType(SWAP_TYPE.UNDEFINED)
  }

  return swapType;
};