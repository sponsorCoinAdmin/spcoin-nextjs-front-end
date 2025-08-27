import { useCallback } from 'react';
import { useExchangeContext } from './base';

export const useNetwork = () => {
  const { exchangeContext } = useExchangeContext();
  return exchangeContext?.network;
};

export const useSetLocalChainId = () => {
  const { setExchangeContext } = useExchangeContext();
  return useCallback((chainId: number) => {
    setExchangeContext((p) => {
      p.network.chainId = chainId;
      return p;
    }, 'useSetLocalChainId');
  }, [setExchangeContext]);
};
