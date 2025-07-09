// File: lib/hooks/useHexInput.ts

'use client';

import { useState, useCallback } from 'react';

export function useHexInput(initialValue: string = '') {
  const [validHexInput, setValidHexValue] = useState(initialValue);
  const [failedHexInput, setFailedHexInput] = useState<string | undefined>(undefined);
  const [failedHexCount, setFailedHexCount] = useState(0); // acts as both flag and invalid entry counter

  const isValidHexInput = useCallback((rawInput: string): boolean => {
    const trimmed = rawInput.trim();

    const isValid =
      trimmed === '' ||
      trimmed === '0' ||
      trimmed === '0x' ||
      /^0x[0-9a-fA-F]*$/.test(trimmed);

    if (isValid) {
      setValidHexValue(trimmed);
      setFailedHexInput(undefined);
      setFailedHexCount(0); // ✅ reset on valid input
    } else {
      setFailedHexInput(trimmed);
      setFailedHexCount((prev) => prev + 1); // ✅ always increment
    }

    return isValid;
  }, []);

  const resetHexInput = useCallback(() => {
    setValidHexValue('');
    setFailedHexInput(undefined);
    setFailedHexCount(0);
  }, []);

  return {
    validHexInput,
    isValidHexInput,
    resetHexInput,
    failedHexInput,     // ❗️shows last failed input
    failedHexCount,     // ❗️used as isValidHex trigger alternative
  };
}
