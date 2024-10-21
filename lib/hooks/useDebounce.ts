import { useEffect, useState } from 'react';

const defaultMilliSeconds = 900;

export const useDebounce = <T>(value: T, delay:number = defaultMilliSeconds) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
};