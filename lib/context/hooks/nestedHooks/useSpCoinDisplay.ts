// File: lib/context/hooks/useSpCoinDisplay.ts

import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY_NEW } from '@/lib/structure';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { debugHookChange } from '@/lib/utils/debugHookChange';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_CONTEXT_HOOKS === 'true';
const debugLog = createDebugLogger('contextHooks(useSpCoinDisplay)', DEBUG_ENABLED, LOG_TIME);

/**
 * ✅ MIGRATED
 * Backwards-compatible hook name that now **uses SP_COIN_DISPLAY_NEW** and writes to
 * `settings.activeDisplay` (single source of truth). Existing call sites can keep
 * using `useSpCoinDisplay()` without code changes.
 */
export const useSpCoinDisplay = (): [
  SP_COIN_DISPLAY_NEW,
  (display: SP_COIN_DISPLAY_NEW) => void
] => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const currentDisplay =
    (exchangeContext?.settings?.activeDisplay as SP_COIN_DISPLAY_NEW) ??
    SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL;

  const setSpCoinDisplay = (display: SP_COIN_DISPLAY_NEW) => {
    if (!exchangeContext?.settings) return;
    debugSetSpCoinDisplay(currentDisplay, display, setExchangeContext);
  };

  return [currentDisplay, setSpCoinDisplay];
};

/**
 * Centralized debug-aware setter for `activeDisplay` with call trace.
 * Replaces legacy `spCoinDisplay` updates.
 */
export const debugSetSpCoinDisplay = (
  oldDisplay: SP_COIN_DISPLAY_NEW,
  newDisplay: SP_COIN_DISPLAY_NEW,
  setExchangeContext: (updater: (prev: any) => any) => void
): void => {
  const displayChange = `${getActiveDisplayString(oldDisplay)} → ${getActiveDisplayString(newDisplay)}`;

  if (DEBUG_ENABLED) {
    const trace = new Error().stack?.split('\n')?.slice(2, 5).join('\n') ?? 'No stack trace available';
    if (oldDisplay !== newDisplay) {
      debugLog.log(`🔁 activeDisplay change: ${displayChange}\n📍 Call site:\n${trace}`);
    } else {
      debugLog.log(`⚠️ activeDisplay unchanged: ${getActiveDisplayString(oldDisplay)}\n📍 Call site:\n${trace}`);
    }
  }

  if (oldDisplay !== newDisplay) {
    debugHookChange('activeDisplay', oldDisplay, newDisplay);
  }

  setExchangeContext((prev: any) => ({
    ...prev,
    settings: {
      ...prev.settings,
      activeDisplay: newDisplay,
    },
  }));
};
