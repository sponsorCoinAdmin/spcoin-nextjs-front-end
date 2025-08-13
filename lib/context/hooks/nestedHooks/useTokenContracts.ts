// File: lib/context/hooks/useTokenContracts.ts

import { TokenContract, SP_COIN_DISPLAY, ExchangeContext } from '@/lib/structure';
import { useExchangeContext } from '@/lib/context/hooks';
import { tokenContractsEqual } from '@/lib/network/utils';
import { isSpCoin } from '@/lib/spCoin/coreUtils';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';
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

    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        sellTokenContract: contract,
      },
    }));
  };

  return [token, setToken];
};

/**
 * Hook for managing buyTokenContract from context.
 * Also manages activeDisplay based on whether the buy token is an spCoin.
 */
export const useBuyTokenContract = (): [
  TokenContract | undefined,
  (contract: TokenContract | undefined) => void
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const token = exchangeContext?.tradeData?.buyTokenContract;

  const setToken = (contract: TokenContract | undefined) => {
    const oldContract = exchangeContext?.tradeData?.buyTokenContract;
    const oldDisplay =
      (exchangeContext?.settings?.activeDisplay as SP_COIN_DISPLAY) ??
      SP_COIN_DISPLAY.TRADING_STATION_PANEL;

    const isSame = tokenContractsEqual(oldContract, contract);
    const isSp = contract && isSpCoin(contract);
    const newDisplay: SP_COIN_DISPLAY = isSp
      ? SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL
      : SP_COIN_DISPLAY.TRADING_STATION_PANEL;

    if (isSame && oldDisplay === newDisplay) return;

    debugHookChange('buyTokenContract', oldContract, contract);

    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        buyTokenContract: contract,
      },
    }));

    debugSetActiveDisplay(oldDisplay, newDisplay, setExchangeContext);
  };

  return [token, setToken];
};

/**
 * Debug-aware setter for activeDisplay with call trace.
 */
const debugSetActiveDisplay = (
  oldDisplay: SP_COIN_DISPLAY,
  newDisplay: SP_COIN_DISPLAY,
  setExchangeContext: (updater: (prev: ExchangeContext) => ExchangeContext) => void
): void => {
  if (oldDisplay === newDisplay) {
    if (DEBUG_ENABLED) {
      const trace = new Error().stack?.split('\n')?.slice(2, 5).join('\n') ?? 'No trace';
      debugLog.log(
        `⚠️ activeDisplay unchanged: ${getActiveDisplayString(oldDisplay)}\n📍 Call site:\n${trace}`
      );
    }
    return;
  }

  if (DEBUG_ENABLED) {
    const trace = new Error().stack?.split('\n')?.slice(2, 5).join('\n') ?? 'No trace';
    debugLog.log(
      `🔁 activeDisplay change: ${getActiveDisplayString(oldDisplay)} → ${getActiveDisplayString(newDisplay)}\n📍 Call site:\n${trace}`
    );
  }

  setExchangeContext((prev) => ({
    ...prev,
    settings: {
      ...prev.settings,
      activeDisplay: newDisplay,
    },
  }));
};

/**
 * Shorthand hook to return just the sell token address.
 */
export const useSellTokenAddress = (): string | undefined => {
  const [sellTokenContract] = useSellTokenContract();
  return sellTokenContract?.address as unknown as string | undefined;
};

/**
 * Shorthand hook to return just the buy token address.
 */
export const useBuyTokenAddress = (): string | undefined => {
  const [buyTokenContract] = useBuyTokenContract();
  return buyTokenContract?.address as unknown as string | undefined;
};
