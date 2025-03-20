import { useEffect, useState } from 'react';

const defaultMilliSeconds = 600;

export const useDebounce = <T>(value: T, delay:number = defaultMilliSeconds) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      alert(`timeout = setTimeout(${defaultMilliSeconds})`)
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
};