// File: lib/hooks/useLatestRef.ts
import { useEffect, useRef } from 'react';

/**
 * Stores the latest value in a ref without changing the ref identity.
 * Great for stable callbacks that need fresh values.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
