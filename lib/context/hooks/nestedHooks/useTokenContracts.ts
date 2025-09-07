// File: lib/context/hooks/useTokenContracts.ts

import { TokenContract } from '@/lib/structure';
import { useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';
import { tokenContractsEqual } from '@/components/shared/utils/isDuplicateAddress';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('useTokenContracts', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook for managing sellTokenContract from context.
 */
export const useSellTokenContract = (): [
  TokenContract | undefined,
  (contract: TokenContract | undefined) => void
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const token = exchangeContext?.tradeData?.sellTokenContract;

  const setToken = (contract: TokenContract | undefined) => {
    const prev = exchangeContext?.tradeData?.sellTokenContract;
    if (tokenContractsEqual(prev, contract)) return;

    debugHookChange('sellTokenContract', prev, contract);

    setExchangeContext((p) => ({
      ...p,
      tradeData: {
        ...p.tradeData,
        sellTokenContract: contract,
      },
    }), 'useSellTokenContract:setToken');
  };

  return [token, setToken];
};

/**
 * Hook for managing buyTokenContract from context.
 * ✅ Simplified: no side-effects on activeDisplay.
 */
export const useBuyTokenContract = (): [
  TokenContract | undefined,
  (contract: TokenContract | undefined) => void
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const token = exchangeContext?.tradeData?.buyTokenContract;

  const setToken = (contract: TokenContract | undefined) => {
    const prev = exchangeContext?.tradeData?.buyTokenContract;
    if (tokenContractsEqual(prev, contract)) return;

    debugHookChange('buyTokenContract', prev, contract);

    setExchangeContext((p) => ({
      ...p,
      tradeData: {
        ...p.tradeData,
        buyTokenContract: contract,
      },
    }), 'useBuyTokenContract:setToken');
  };

  return [token, setToken];
};

/** Shorthand: just the sell token address. */
export const useSellTokenAddress = (): string | undefined => {
  const [sellTokenContract] = useSellTokenContract();
  return sellTokenContract?.address as unknown as string | undefined;
};

/** Shorthand: just the buy token address. */
export const useBuyTokenAddress = (): string | undefined => {
  const [buyTokenContract] = useBuyTokenContract();
  return buyTokenContract?.address as unknown as string | undefined;
};
