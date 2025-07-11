// File: lib/hooks/useHexInput.ts

'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

export function useHexInput(initialValue: string = '', debounceDelay: number = 250) {
  const [validHexInput, setValidHexInput] = useState(initialValue);  // ✅ immediate value
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
      setValidHexInput(trimmed);
      setFailedHexInput(undefined);
      setFailedHexCount(0);
    } else {
      setFailedHexInput(trimmed);
      setFailedHexCount((prev) => prev + 1);
    }

    return isValid;
  }, []);

  const handleHexInputChange = useCallback(
    (rawInput: string, _isManual?: boolean) => {
      const ok = isValidHexInput(rawInput);
      // Optionally: handle side-effects or callbacks on ok/fail here
      return ok;
    },
    [isValidHexInput]
  );

  const resetHexInput = useCallback(() => {
    setValidHexInput('');
    setFailedHexInput(undefined);
    setFailedHexCount(0);
  }, []);

  const debouncedHexInput =
    debounceDelay === 0 ? validHexInput : useDebounce(validHexInput, debounceDelay);

return {
  validHexInput,        // ✅ immediate valid hex input value: for binding to input UI
  debouncedHexInput,    // ✅ debounced hex input value: for effects, validations, API calls (updates after debounceDelay)
  handleHexInputChange, // ✅ wrapped input handler: recommended for passing directly to onChange in components
  isValidHexInput,      // ✅ direct validator function: for manual raw string validation if needed outside the handler
  resetHexInput,        // ✅ function to reset the input and error state back to initial (clears both valid and failed input)
  failedHexInput,       // ✅ last invalid raw input string (if any), for displaying user-facing error messages or debug info
  failedHexCount,       // ✅ count of consecutive invalid input attempts, useful for limiting retries or triggering warnings
};

}
