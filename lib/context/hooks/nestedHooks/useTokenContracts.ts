'use client';

import { TokenContract, SP_COIN_DISPLAY, ExchangeContext } from '@/lib/structure';
import { useExchangeContext } from '@/lib/context/hooks';
import { tokenContractsEqual } from '@/lib/network/utils';
import { isSpCoin } from '@/lib/spCoin/coreUtils';
import { spCoinDisplayString } from '@/lib/spCoin/guiControl';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('contextHooks', DEBUG_ENABLED, LOG_TIME);

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
    const oldContract = exchangeContext?.tradeData?.sellTokenContract;
    if (tokenContractsEqual(oldContract, contract)) return;

    debugHookChange('sellTokenContract', oldContract, contract);

    setExchangeContext(
      (prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          sellTokenContract: contract,
        },
      }),
      `contextHooks: sellTokenContract → ${oldContract?.symbol ?? 'none'} → ${contract?.symbol ?? 'none'}`
    );
  };

  return [token, setToken];
};

/**
 * Hook for managing buyTokenContract from context.
 * Also manages spCoinDisplay based on whether buy token is an spCoin.
 */
export const useBuyTokenContract = (): [
  TokenContract | undefined,
  (contract: TokenContract | undefined) => void
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const token = exchangeContext?.tradeData?.buyTokenContract;

  const setToken = (contract: TokenContract | undefined) => {
    const oldContract = exchangeContext?.tradeData?.buyTokenContract;
    const oldDisplay = exchangeContext?.settings?.spCoinDisplay ?? SP_COIN_DISPLAY.EXCHANGE_ROOT;

    const isSame = tokenContractsEqual(oldContract, contract);
    const isSp = contract && isSpCoin(contract);
    const newDisplay = isSp
      ? SP_COIN_DISPLAY.SHOW_ACTIVE_RECIPIENT_CONTAINER
      : SP_COIN_DISPLAY.EXCHANGE_ROOT;

    if (isSame && oldDisplay === newDisplay) return;

    debugHookChange('buyTokenContract', oldContract, contract);

    setExchangeContext(
      (prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          buyTokenContract: contract,
        },
      }),
      `contextHooks: buyTokenContract → ${oldContract?.symbol ?? 'none'} → ${contract?.symbol ?? 'none'}`
    );

    debugSetSpCoinDisplay(oldDisplay, newDisplay, setExchangeContext);
  };

  return [token, setToken];
};

/**
 * Debug-aware setter for spCoinDisplay with call trace.
 */
const debugSetSpCoinDisplay = (
  oldDisplay: SP_COIN_DISPLAY,
  newDisplay: SP_COIN_DISPLAY,
  updateExchangeContext: (updater: (prev: ExchangeContext) => ExchangeContext, reason: string) => void
): void => {
  if (oldDisplay === newDisplay) {
    if (DEBUG_ENABLED) {
      const trace = new Error().stack?.split('\n')?.slice(2, 5).join('\n') ?? 'No trace';
      debugLog.log(`⚠️ spCoinDisplay unchanged: ${spCoinDisplayString(oldDisplay)}\n📍 Call site:\n${trace}`);
    }
    return;
  }

  if (DEBUG_ENABLED) {
    const trace = new Error().stack?.split('\n')?.slice(2, 5).join('\n') ?? 'No trace';
    debugLog.log(`🔁 spCoinDisplay change: ${spCoinDisplayString(oldDisplay)} → ${spCoinDisplayString(newDisplay)}\n📍 Call site:\n${trace}`);
  }

  updateExchangeContext(
    (prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        spCoinDisplay: newDisplay,
      },
    }),
    `contextHooks: spCoinDisplay → ${spCoinDisplayString(oldDisplay)} → ${spCoinDisplayString(newDisplay)}`
  );
};

/**
 * Shorthand hook to return just the sell token address.
 */
export const useSellTokenAddress = (): string | undefined => {
  const [sellTokenContract] = useSellTokenContract();
  return sellTokenContract?.address;
};

/**
 * Shorthand hook to return just the buy token address.
 */
export const useBuyTokenAddress = (): string | undefined => {
  const [buyTokenContract] = useBuyTokenContract();
  return buyTokenContract?.address;
};
