// File: lib/hooks/useHexInput.ts

'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

/**
 * ✅ Pure utility function to validate a hex string.
 */
const _isValidHexString = (rawInput: string): boolean => {
  const trimmed = rawInput.trim();
  return (
    trimmed === '' ||
    trimmed === '0' ||
    trimmed === '0x' ||
    /^0x[0-9a-fA-F]*$/.test(trimmed)
  );
};

export function useHexInput(initialValue: string = '', debounceDelay: number = 250) {
  const [validHexInput, setValidHexInput] = useState(initialValue);
  const [failedHexInput, setFailedHexInput] = useState<string | undefined>(undefined);
  const [failedHexCount, setFailedHexCount] = useState(0);
  const [isValid, setIsValid] = useState(true);

  const isValidHexString = useCallback((rawInput: string): boolean => {
    return _isValidHexString(rawInput);
  }, []);

  const handleHexInputChange = useCallback(
    (rawInput: string, _isManual?: boolean) => {
      const ok = _isValidHexString(rawInput);
      setIsValid(ok);

      if (ok) {
        setValidHexInput(rawInput.trim());
        setFailedHexInput(undefined);
        setFailedHexCount(0);
      } else {
        setFailedHexInput(rawInput.trim());
        setFailedHexCount((prev) => prev + 1);
      }

      return ok;
    },
    []
  );

  const resetHexInput = useCallback(() => {
    setValidHexInput('');
    setFailedHexInput(undefined);
    setFailedHexCount(0);
    setIsValid(true);
  }, []);

  const debouncedHexInput =
    debounceDelay === 0 ? validHexInput : useDebounce(validHexInput, debounceDelay);

  return {
    validHexInput,        // ✅ immediate input value
    debouncedHexInput,    // ✅ debounced input value
    handleHexInputChange, // ✅ main input change handler
    isValid,              // ✅ reactive validity state
    resetHexInput,        // ✅ clears all input + error state
    failedHexInput,       // ✅ last invalid input string
    failedHexCount,       // ✅ invalid input count
    isValidHexString,     // ✅ exported as part of the hook's return for pure validation needs
  };
}
