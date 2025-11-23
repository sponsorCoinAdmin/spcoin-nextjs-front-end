// File: @/lib/hooks/useDebounce.ts
import { useEffect, useState } from 'react';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const defaultMilliSeconds = 600;

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_DEBOUNCE === 'true';
const debugLog = createDebugLogger('useDebounce', DEBUG_ENABLED, LOG_TIME);

/**
 * Debounce hook with update suppression and optional debug logging.
 */
export const useDebounce = <T>(value: T, delay: number = defaultMilliSeconds): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (value === debouncedValue) {
      debugLog.log?.('[🛑 useDebounce] Value unchanged, skipping debounce', {
        value,
      });
      return;
    }

    debugLog.log?.('[⏳ useDebounce] Debouncing', {
      delay,
      value,
    });

    const timer = setTimeout(() => {
      setDebouncedValue(value);
      debugLog.log?.('[✅ useDebounce] Debounced value committed', {
        value,
      });
    }, delay);

    return () => {
      clearTimeout(timer);
      debugLog.log?.('[❌ useDebounce] Timer cleared', {
        value,
      });
    };
  }, [value, delay, debouncedValue]);

  return debouncedValue;
};
