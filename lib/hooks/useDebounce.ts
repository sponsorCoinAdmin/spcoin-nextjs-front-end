import { useEffect, useState } from 'react';

const defaultMilliSeconds = 600;

export const useDebounce = <T>(value: T, delay: number = defaultMilliSeconds): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    console.log("[⏳ useDebounce] Waiting", delay, "ms for:", value);

    const timeout = setTimeout(() => {
      setDebouncedValue(value);
      console.log("[✅ useDebounce] Debounced value set:", value);
    }, delay);

    return () => {
      clearTimeout(timeout);
      console.log("[❌ useDebounce] Cleared previous timeout for:", value);
    };
  }, [value, delay]);

  return debouncedValue;
};
