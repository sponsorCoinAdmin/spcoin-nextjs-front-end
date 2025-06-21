'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { spCoinDisplayString } from '@/lib/spCoin/guiControl';
import { createDebugLogger, debugHookChange } from '@/lib/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('contextHooks', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook to read and update `spCoinDisplay` with debug output.
 */
export const useSpCoinDisplay = (): [SP_COIN_DISPLAY, (display: SP_COIN_DISPLAY) => void] => {
  const { exchangeContext, setExchangeContext: updateExchangeContext } = useExchangeContext();

  const currentDisplay = exchangeContext?.settings?.spCoinDisplay ?? SP_COIN_DISPLAY.EXCHANGE_ROOT;

  const setSpCoinDisplay = (display: SP_COIN_DISPLAY) => {
    if (!exchangeContext?.settings) return;
    debugSetSpCoinDisplay(currentDisplay, display, updateExchangeContext);
  };

  return [currentDisplay, setSpCoinDisplay];
};

/**
 * Centralized debug-aware setter for `spCoinDisplay` with call trace.
 */
export const debugSetSpCoinDisplay = (
  oldDisplay: SP_COIN_DISPLAY,
  newDisplay: SP_COIN_DISPLAY,
  updateExchangeContext: (updater: (prev: any) => any, reason?: string) => void
): void => {
  const oldStr = spCoinDisplayString(oldDisplay);
  const newStr = spCoinDisplayString(newDisplay);
  const displayChange = `${oldStr} → ${newStr}`;

  if (DEBUG_ENABLED) {
    const trace = new Error().stack?.split('\n')?.slice(2, 5).join('\n') ?? 'No stack trace available';
    if (oldDisplay !== newDisplay) {
      debugLog.log(`🔁 spCoinDisplay change: ${displayChange}\n📍 Call site:\n${trace}`);
    } else {
      debugLog.log(`⚠️ spCoinDisplay unchanged: ${oldStr}\n📍 Call site:\n${trace}`);
    }
  }

  if (oldDisplay !== newDisplay) {
    debugHookChange('spCoinDisplay', oldDisplay, newDisplay);
  }

  updateExchangeContext(
    (prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        spCoinDisplay: newDisplay,
      },
    }),
    `reason: contextHooks updating spCoinDisplay from ${oldStr} to ${newStr}`
  );
};
