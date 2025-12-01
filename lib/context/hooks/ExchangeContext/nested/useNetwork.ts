// File: @/lib/context/hooks/ExchangeContext/nested/useNetwork.ts
'use client';

import { useCallback } from 'react';
import { useExchangeContext } from '../useExchangeContext';

// Infer the network type from the context instead of importing a non-existent ExchangeNetwork
type Network = ReturnType<typeof useExchangeContext>['exchangeContext']['network'];

type NetworkUpdater = Network | ((prev: Network) => Network);

export function useNetwork(): [Network, (next: NetworkUpdater) => void] {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const network = exchangeContext.network;

  const setNetwork = useCallback(
    (next: NetworkUpdater) => {
      setExchangeContext(
        (prev) => {
          const current = prev.network as Network;
          const updated =
            typeof next === 'function'
              ? (next as (p: Network) => Network)(current)
              : next;

          return {
            ...prev,
            network: updated,
          };
        },
        'useNetwork:setNetwork',
      );
    },
    [setExchangeContext],
  );

  return [network, setNetwork];
}
