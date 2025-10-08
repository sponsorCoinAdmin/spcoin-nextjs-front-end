// File: lib/context/hooks/nestedHooks/useTokenContracts.ts

import { useContext } from 'react';
import type { TokenContract } from '@/lib/structure';
import { debugHookChange } from '@/lib/utils/debugHookChange';
import { tokenContractsEqual } from '@/components/shared/utils/isDuplicateAddress';
// Import the provider state directly to avoid barrel ↔ barrel cycles
import { ExchangeContextState } from '../../ExchangeProvider';

// Local, cycle-free access to the exchange context
function useExchangeContextDirect() {
  const ctx = useContext(ExchangeContextState);
  if (!ctx) throw new Error('❌ useTokenContracts must be used within an ExchangeProvider');
  return ctx;
}

/**
 * Hook for managing sellTokenContract from context.
 */
export const useSellTokenContract = (): [
  TokenContract | undefined,
  (contract: TokenContract | undefined) => void
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContextDirect();
  const token = exchangeContext?.tradeData?.sellTokenContract;

  const setToken = (contract: TokenContract | undefined) => {
    const prev = exchangeContext?.tradeData?.sellTokenContract;
    if (tokenContractsEqual(prev, contract)) return;

    debugHookChange('sellTokenContract', prev, contract);

    setExchangeContext(
      (p) => ({
        ...p,
        tradeData: {
          ...p.tradeData,
          sellTokenContract: contract,
        },
      }),
      'useSellTokenContract:setToken'
    );
  };

  return [token, setToken];
};

/**
 * Hook for managing buyTokenContract from context.
 */
export const useBuyTokenContract = (): [
  TokenContract | undefined,
  (contract: TokenContract | undefined) => void
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContextDirect();
  const token = exchangeContext?.tradeData?.buyTokenContract;

  const setToken = (contract: TokenContract | undefined) => {
    const prev = exchangeContext?.tradeData?.buyTokenContract;
    if (tokenContractsEqual(prev, contract)) return;

    debugHookChange('buyTokenContract', prev, contract);

    setExchangeContext(
      (p) => ({
        ...p,
        tradeData: {
          ...p.tradeData,
          buyTokenContract: contract,
        },
      }),
      'useBuyTokenContract:setToken'
    );
  };

  return [token, setToken];
};

/** Shorthand: just the sell token address. */
export const useSellTokenAddress = (): string | undefined => {
  const [sellTokenContract] = useSellTokenContract();
  const addr = sellTokenContract?.address as unknown;
  return typeof addr === 'string' ? addr : undefined;
};

/** Shorthand: just the buy token address. */
export const useBuyTokenAddress = (): string | undefined => {
  const [buyTokenContract] = useBuyTokenContract();
  const addr = buyTokenContract?.address as unknown;
  return typeof addr === 'string' ? addr : undefined;
};
