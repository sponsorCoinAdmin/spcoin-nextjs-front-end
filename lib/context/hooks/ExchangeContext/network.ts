import { useExchangeContext } from './base';
import { resolveNetworkElement } from '../../helpers/NetworkHelpers';

export const useNetwork = () => {
  const { exchangeContext } = useExchangeContext();
  return exchangeContext?.network;
};

// File: lib/context/hooks/ExchangeContext/network.ts
export const useSetLocalChainId = () => {
  const { setExchangeContext } = useExchangeContext();
  return (chainId: number) =>
    setExchangeContext((p) => {
      const next = structuredClone(p);
      next.network = resolveNetworkElement(chainId, next.network);
      return next;
    }, 'useSetLocalChainId');
};

