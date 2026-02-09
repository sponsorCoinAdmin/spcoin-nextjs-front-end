// File: @/lib/context/hooks/nestedHooks/useTokenContracts.ts

import { useContext } from 'react';
import type { TokenContract } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { debugHookChange } from '@/lib/utils/debugHookChange';
import { tokenContractsEqual } from '@/components/shared/utils/isDuplicateAddress';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
// Import the provider state directly to avoid barrel ↔ barrel cycles
import { ExchangeContextState } from '../../ExchangeProvider';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_CONTRACTS === 'true';
const tLog = createDebugLogger('useTokenContracts', DEBUG_ENABLED, LOG_TIME);

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
    const isEqual = tokenContractsEqual(prev, contract);

    tLog.log?.('[sellTokenContract] setToken', {
      prevAddress: (prev as any)?.address,
      nextAddress: (contract as any)?.address,
      equal: isEqual,
    });

    if (isEqual) return;

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
    const isEqual = tokenContractsEqual(prev, contract);

    tLog.log?.('[buyTokenContract] setToken', {
      prevAddress: (prev as any)?.address,
      nextAddress: (contract as any)?.address,
      equal: isEqual,
    });

    if (isEqual) return;

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

/**
 * Peer token address for duplicate detection.
 *
 * - TOKEN_LIST_SELECT_PANEL + SELL_TOKEN active: peer = current BUY token address.
 * - TOKEN_LIST_SELECT_PANEL + BUY_TOKEN active (or fallback): peer = current SELL token address.
 * - Other containers: no peer (undefined).
 *
 * Returns a plain string so it can be passed directly into FSM `peerAddress`.
 */
export const usePeerTokenAddress = (
  containerType: SP_COIN_DISPLAY,
): string | undefined => {
  const sellAddr = useSellTokenAddress();
  const buyAddr = useBuyTokenAddress();
  const buyMode = usePanelVisible(SP_COIN_DISPLAY.BUY_TOKEN);
  const sellMode = usePanelVisible(SP_COIN_DISPLAY.SELL_TOKEN);

  switch (containerType) {
    case SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL:
      // SELL_TOKEN active => selecting SELL, compare against BUY
      if (sellMode) return buyAddr ?? undefined;
      // BUY_TOKEN active => selecting BUY, compare against SELL
      if (buyMode) return sellAddr ?? undefined;
      return buyAddr ?? undefined;

    default:
      return undefined;
  }
};
