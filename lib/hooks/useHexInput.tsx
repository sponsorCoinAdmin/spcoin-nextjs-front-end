// File: lib/hooks/useHexInput.ts

'use client';

import { useState, useCallback } from 'react';

export function useHexInput(initialValue: string = '') {
  const [inputValue, setInputValue] = useState(initialValue);
  const [hexWarning, setHexWarning] = useState(false);

  const alertInvalidHexInput = (trimmed: string, isValidHex: boolean): boolean => {
    if (!isValidHex)
      alert(`validateHexInput:trimmed = ${trimmed}, isValidHex = ${isValidHex}`);
    return isValidHex;
  }

  const validateHexInput = useCallback((rawInput: string): boolean => {
    const trimmed = rawInput.trim();

    const isValidHex =
      trimmed === '' ||
      trimmed === '0' ||
      trimmed === '0x' ||
      /^0x[0-9a-fA-F]*$/.test(trimmed);

    if (isValidHex) {
      setInputValue(trimmed);
    }
    setHexWarning(!isValidHex); // ✅ replicate the behavior
    alertInvalidHexInput(trimmed, isValidHex);
    return isValidHex;
  }, []);

  const clearInput = useCallback(() => {
    setInputValue('');
    setHexWarning(false);
  }, []);

  return {
    inputValue,
    validateHexInput,
    clearInput,
    hexWarning,
  };
}
