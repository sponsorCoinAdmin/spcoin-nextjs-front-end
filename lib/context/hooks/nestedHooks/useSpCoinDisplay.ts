'use client';

import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { spCoinDisplayString } from '@/lib/spCoin/guiControl';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('contextHooks', DEBUG_ENABLED, LOG_TIME);

/**
 * Hook to read and update `spCoinDisplay` with debug output.
 */
export const useSpCoinDisplay = (): [SP_COIN_DISPLAY, (display: SP_COIN_DISPLAY) => void] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const currentDisplay = exchangeContext?.settings?.spCoinDisplay ?? SP_COIN_DISPLAY.EXCHANGE_ROOT;

  const setSpCoinDisplay = (display: SP_COIN_DISPLAY) => {
    if (!exchangeContext?.settings) return;
    const oldDisplay = currentDisplay;
    const oldStr = spCoinDisplayString(oldDisplay);
    const newStr = spCoinDisplayString(display);

    if (DEBUG_ENABLED) {
      const trace = new Error().stack?.split('\n')?.slice(2, 5).join('\n') ?? 'No stack trace available';
      if (oldDisplay !== display) {
        debugLog.log(`🔁 spCoinDisplay change: ${oldStr} → ${newStr}\n📍 Call site:\n${trace}`);
      } else {
        debugLog.log(`⚠️ spCoinDisplay unchanged: ${oldStr}\n📍 Call site:\n${trace}`);
      }
    }

    if (oldDisplay !== display) {
      debugHookChange('spCoinDisplay', oldDisplay, display);

      setExchangeContext(
        (prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            spCoinDisplay: display,
          },
        }),
        `contextHooks updating spCoinDisplay from ${oldStr} to ${newStr}` // ✅ reason is always a string
      );
    }
  };

  return [currentDisplay, setSpCoinDisplay];
};
