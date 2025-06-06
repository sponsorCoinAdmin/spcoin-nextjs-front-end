// File: lib/context/hooks/nestedHooks/useSpCoinDisplay.ts

import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { spCoinDisplayString } from '@/lib/spCoin/guiControl';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('contextHooks', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook to read and update `spCoinDisplay` with debug output.
 */
export const useSpCoinDisplay = (): [SP_COIN_DISPLAY, (display: SP_COIN_DISPLAY) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const setSpCoinDisplay = (display: SP_COIN_DISPLAY) =>
    debugSetSpCoinDisplay(exchangeContext.settings.spCoinDisplay, display, setExchangeContext);

  return [exchangeContext.settings.spCoinDisplay, setSpCoinDisplay];
};

/**
 * Centralized debug-aware setter for `spCoinDisplay` with call trace.
 */
export const debugSetSpCoinDisplay = (
  oldDisplay: SP_COIN_DISPLAY,
  newDisplay: SP_COIN_DISPLAY,
  setExchangeContext: (updater: (prev: any) => any) => void
): void => {
  const displayChange = `${spCoinDisplayString(oldDisplay)} → ${spCoinDisplayString(newDisplay)}`;

  if (DEBUG_ENABLED) {
    const trace = new Error().stack?.split('\n')?.slice(2, 5).join('\n') ?? 'No stack trace available';
    if (oldDisplay !== newDisplay) {
      debugLog.log(`🔁 spCoinDisplay change: ${displayChange}\n📍 Call site:\n${trace}`);
    } else {
      debugLog.log(`⚠️ spCoinDisplay unchanged: ${spCoinDisplayString(oldDisplay)}\n📍 Call site:\n${trace}`);
    }
  }

  setExchangeContext((prev) => ({
    ...prev,
    settings: {
      ...prev.settings,
      spCoinDisplay: newDisplay,
    },
  }));
};
