// File: lib/hooks/useHexInput.ts

'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

export function useHexInput(initialValue: string = '', debounceDelay: number = 250) {
  const [rawHexInput, setRawHexInput] = useState(initialValue);
  const [failedHexInput, setFailedHexInput] = useState<string | undefined>(undefined);
  const [failedHexCount, setFailedHexCount] = useState(0);

  const isValidHexInput = useCallback((rawInput: string): boolean => {
    const trimmed = rawInput.trim();

    const isValid =
      trimmed === '' ||
      trimmed === '0' ||
      trimmed === '0x' ||
      /^0x[0-9a-fA-F]*$/.test(trimmed);

    if (isValid) {
      setRawHexInput(trimmed);
      setFailedHexInput(undefined);
      setFailedHexCount(0);
    } else {
      setFailedHexInput(trimmed);
      setFailedHexCount((prev) => prev + 1);
    }

    return isValid;
  }, []);

  const resetHexInput = useCallback(() => {
    setRawHexInput('');
    setFailedHexInput(undefined);
    setFailedHexCount(0);
  }, []);

  // ✅ Final exposed value — either immediate or debounced, based on debounceDelay
  const validHexInput =
    debounceDelay === 0 ? rawHexInput : useDebounce(rawHexInput, debounceDelay);

  return {
    validHexInput,        // ✅ single, clean exposed value
    isValidHexInput,
    resetHexInput,
    failedHexInput,
    failedHexCount,
  };
}
