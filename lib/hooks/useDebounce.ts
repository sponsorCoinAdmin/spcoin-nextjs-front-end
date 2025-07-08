// File: lib/hooks/useDebounce.ts
import { useEffect, useState } from 'react';

const defaultMilliSeconds = 600;
let isDebug: boolean = process.env.NEXT_PUBLIC_DEBUG_DEBOUNCE === 'true';
isDebug = false;

/**
 * Debounce hook with update suppression and optional debug logging.
 */
export const useDebounce = <T>(value: T, delay: number = defaultMilliSeconds): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (value === debouncedValue) {
      if (isDebug) {
        console.log(`[🛑 useDebounce] Value unchanged, skipping debounce:`, value);
      }
      return;
    }

    if (isDebug) {
      console.log(`[⏳ useDebounce] Debouncing ${delay}ms for:`, value);
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
      if (isDebug) {
        console.log(`[✅ useDebounce] Debounced value committed:`, value);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      if (isDebug) {
        console.log(`[❌ useDebounce] Timer cleared for:`, value);
      }
    };
  }, [value, delay, debouncedValue]);

  return debouncedValue;
};
