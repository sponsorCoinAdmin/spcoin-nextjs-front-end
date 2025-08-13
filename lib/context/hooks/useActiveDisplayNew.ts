// File: lib/context/hooks/useActiveDisplayNew.ts

import { useExchangeContext } from '@/lib/context/hooks/useExchangeContext';
import { SP_COIN_DISPLAY_NEW } from '@/lib/structure';
import { Settings_NEW } from '@/lib/structure/types/settings_NEW';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ACTIVE_DISPLAY === 'true';
const debugLog = createDebugLogger('useActiveDisplayNew', DEBUG_ENABLED, LOG_TIME);

type ExchangeContextWithNEW = {
  settings_NEW?: Settings_NEW;
};

/** Read-only accessor for NEW ExchangeContext panel display */
export function useActiveDisplayNew() {
  const { exchangeContext } = useExchangeContext();
  const ctx = exchangeContext as typeof exchangeContext & ExchangeContextWithNEW;

  const activeDisplay =
    ctx.settings_NEW?.spCoinDisplay ?? SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL;

  return { activeDisplay };
}

/** Writer utilities for NEW ExchangeContext panel display */
export function useDisplayControlsNew() {
  const { setExchangeContext } = useExchangeContext();

  const updateActiveDisplay = (next: SP_COIN_DISPLAY_NEW) => {
    setExchangeContext(prev => {
      const ctx = structuredClone(prev) as typeof prev & ExchangeContextWithNEW;

      // Ensure the NEW settings bag exists
      if (!ctx.settings_NEW) {
        ctx.settings_NEW = { spCoinDisplay: SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL };
      }

      const to = next ?? SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL;
      debugLog.log('→ set display (NEW)', { from: ctx.settings_NEW.spCoinDisplay, to });
      ctx.settings_NEW.spCoinDisplay = to;

      return ctx;
    });
  };

  const resetToMain = () => updateActiveDisplay(SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL);

  return { updateActiveDisplay, resetToMain };
}
