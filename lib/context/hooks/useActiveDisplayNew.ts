// File: lib/context/hooks/useActiveDisplayNew.ts

import { useExchangeContext } from '@/lib/context/hooks/useExchangeContext';
import { SP_COIN_DISPLAY_NEW } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ACTIVE_DISPLAY === 'true';
const debugLog = createDebugLogger('useActiveDisplayNew', DEBUG_ENABLED, LOG_TIME);

/** Coerce any incoming value to a valid SP_COIN_DISPLAY_NEW, or default. */
function coerceDisplay(value: unknown): SP_COIN_DISPLAY_NEW {
  const valid = new Set<number>(
    (Object.values(SP_COIN_DISPLAY_NEW).filter((v) => typeof v === 'number') as number[])
  );
  const asNum = typeof value === 'number' ? value : undefined;
  return asNum !== undefined && valid.has(asNum)
    ? (asNum as SP_COIN_DISPLAY_NEW)
    : SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL;
}

/** Read-only accessor for the NEW panel display (single source: settings.activeDisplay). */
export function useActiveDisplayNew() {
  const { exchangeContext } = useExchangeContext();
  const activeDisplay = coerceDisplay(exchangeContext?.settings?.activeDisplay);
  return { activeDisplay };
}

/** Writer utilities for NEW panel display (updates settings.activeDisplay). */
export function useDisplayControlsNew() {
  const { setExchangeContext } = useExchangeContext();

  const updateActiveDisplay = (next: SP_COIN_DISPLAY_NEW) => {
    setExchangeContext((prev) => {
      const from = coerceDisplay(prev?.settings?.activeDisplay);
      const to = coerceDisplay(next);
      const cloned = structuredClone(prev);
      cloned.settings = {
        ...cloned.settings,
        activeDisplay: to,
      };
      debugLog.log('→ set display (NEW)', {
        from: `${SP_COIN_DISPLAY_NEW[from]} (${from})`,
        to: `${SP_COIN_DISPLAY_NEW[to]} (${to})`,
      });
      return cloned;
    });
  };

  const resetToMain = () => updateActiveDisplay(SP_COIN_DISPLAY_NEW.TRADING_STATION_PANEL);

  return { updateActiveDisplay, resetToMain };
}
