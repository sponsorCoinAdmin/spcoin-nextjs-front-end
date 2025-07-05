// File: lib/hooks/useHexInput.tsx

import { useState, useCallback } from 'react';

export function useHexInput(initialValue: string = '') {
  const [inputValue, setInputValue] = useState(initialValue);

  const validateHexInput = useCallback((rawInput: string) => {
    const trimmed = rawInput.trim();

    if (trimmed === '') {
      setInputValue('');
      return;
    }

    if (trimmed === '0') {
      // Allow user to type just "0" temporarily (to reach "0x")
      setInputValue(trimmed);
      return;
    }

    if (trimmed === '0x' || /^0x[0-9a-fA-F]*$/.test(trimmed)) {
      // Allow "0x" exactly or "0x" followed by hex digits
      setInputValue(trimmed);
      return;
    }

    // else: invalid, ignore
  }, []);

  const clearInput = useCallback(() => {
    setInputValue('');
  }, []);

  return {
    inputValue,
    validateHexInput,
    clearInput,
  };
}
