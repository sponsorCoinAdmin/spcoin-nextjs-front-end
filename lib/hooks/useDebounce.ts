import { useEffect, useState } from 'react';
import { logAlert } from '../spCoin/utils';

const defaultMilliSeconds = 600;

export const useDebounce = <T>(value: T, delay: number = defaultMilliSeconds): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    logAlert(`[⏳ useDebounce] Waiting ${delay}ms for: ${value}`,`useDebounce`, false, false);

    const timeout = setTimeout(() => {
      setDebouncedValue(value);
      logAlert(`[✅ useDebounce] Debounced value set: ${value}`,`useDebounce`, false, false);
    }, delay);

    return () => {
      clearTimeout(timeout);
      logAlert(`[❌ useDebounce] Cleared previous timeout for: ${value}`,`useDebounce`, false, false);
    };
  }, [value, delay]);

  return debouncedValue;
};
