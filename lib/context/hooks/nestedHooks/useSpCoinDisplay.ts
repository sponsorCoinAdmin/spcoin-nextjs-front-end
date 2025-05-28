// File: lib/context/hooks/nestedHooks/useSpCoinDisplay.ts

import { useExchangeContext } from '@/lib/context/hooks/contextHooks';
import { SP_COIN_DISPLAY } from '@/lib/structure/types';
import { spCoinDisplayString } from '@/lib/spCoin/guiControl';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('contextHooks', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook to read and update spCoinDisplay with debug output.
 */
export const useSpCoinDisplay = (): [SP_COIN_DISPLAY, (display: SP_COIN_DISPLAY) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const wrappedDebugSetter = (display: SP_COIN_DISPLAY) =>
    debugSetSpCoinDisplay(exchangeContext.spCoinDisplay, display, setExchangeContext);

  return [exchangeContext.spCoinDisplay, wrappedDebugSetter];
};

/**
 * Centralized debug-aware setter for spCoinDisplay.
 */
export const debugSetSpCoinDisplay = (
  oldDisplay: SP_COIN_DISPLAY,
  newDisplay: SP_COIN_DISPLAY,
  setExchangeContext: (updater: (prev: any) => any) => void
) => {
  if (oldDisplay !== newDisplay) {
    debugLog.log(
      `🔁 spCoinDisplay change: ${spCoinDisplayString(oldDisplay)} → ${spCoinDisplayString(newDisplay)}`
    );
  } else {
    debugLog.log(`⚠️ spCoinDisplay unchanged: ${spCoinDisplayString(oldDisplay)}`);
  }

  setExchangeContext((prev) => ({
    ...prev,
    spCoinDisplay: newDisplay,
  }));
};
