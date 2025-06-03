// File: lib/context/hooks/nestedHooks/useTokenContracts.ts

import { TokenContract, SP_COIN_DISPLAY } from '@/lib/structure/types';
import { useExchangeContext } from '@/lib/context/hooks/contextHooks';
import { tokenContractsEqual } from '@/lib/network/utils';
import { isSpCoin } from '@/lib/spCoin/coreUtils';
import { spCoinDisplayString } from '@/lib/spCoin/guiControl';
import { createDebugLogger } from '@/lib/utils/debugLogger';

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

  return [
    exchangeContext.tradeData.sellTokenContract,
    (contract) => {
      const oldContract = exchangeContext.tradeData.sellTokenContract;
      if (tokenContractsEqual(oldContract, contract)) return;

      setExchangeContext((prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          sellTokenContract: contract,
        },
      }));
    },
  ];
};

/**
 * Hook for managing buyTokenContract from context,
 * also manages spCoinDisplay based on whether buy token is an spCoin.
 */
export const useBuyTokenContract = (): [
  TokenContract | undefined,
  (contract: TokenContract | undefined) => void
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  return [
    exchangeContext.tradeData.buyTokenContract,
    (contract) => {
      const oldContract = exchangeContext.tradeData.buyTokenContract;
      const oldDisplay = exchangeContext.settings.spCoinDisplay;

      const isSame = tokenContractsEqual(oldContract, contract);
      const isSp = contract && isSpCoin(contract);
      const newDisplay = isSp ? SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON : SP_COIN_DISPLAY.OFF;

      if (isSame && oldDisplay === newDisplay) return;

      setExchangeContext((prev) => ({
        ...prev,
        tradeData: {
          ...prev.tradeData,
          buyTokenContract: contract,
        },
      }));

      debugSetSpCoinDisplay(oldDisplay, newDisplay, setExchangeContext);
    },
  ];
};

/**
 * Shared debug-aware setter for spCoinDisplay with call trace.
 */
const debugSetSpCoinDisplay = (
  oldDisplay: SP_COIN_DISPLAY,
  newDisplay: SP_COIN_DISPLAY,
  setExchangeContext: (updater: (prev: any) => any) => void
) => {
  if (!DEBUG_ENABLED) {
    if (oldDisplay !== newDisplay) {
      setExchangeContext((prev) => ({ ...prev, spCoinDisplay: newDisplay }));
    }
    return;
  }

  const trace = new Error().stack?.split('\n')?.slice(2, 5).join('\n') ?? 'No trace';
  if (oldDisplay !== newDisplay) {
    debugLog.log(`🔁 spCoinDisplay change: ${spCoinDisplayString(oldDisplay)} → ${spCoinDisplayString(newDisplay)}\n📍 Call site:\n${trace}`);
  } else {
    debugLog.log(`⚠️ spCoinDisplay unchanged: ${spCoinDisplayString(oldDisplay)}\n📍 Call site:\n${trace}`);
  }

  setExchangeContext((prev) => ({
    ...prev,
    spCoinDisplay: newDisplay,
  }));
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
