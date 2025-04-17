import { useMemo } from "react";
import { useContainerType, useExchangeContext } from "@/lib/context/contextHooks";
import { CONTAINER_TYPE } from "@/lib/structure/types";

export const useIsDuplicateToken = (tokenAddress?: string): boolean => {
    const { exchangeContext } = useExchangeContext();
    const [containerType] = useContainerType();
  
    const isDuplicate = useMemo(() => {
      if (!tokenAddress) return false;
  
      const { buyTokenContract, sellTokenContract } = exchangeContext.tradeData;
      const oppositeTokenAddress =
        containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
          ? buyTokenContract?.address
          : sellTokenContract?.address;
  
      return tokenAddress === oppositeTokenAddress;
    }, [tokenAddress, containerType, exchangeContext.tradeData]);
  
    return isDuplicate;
  };