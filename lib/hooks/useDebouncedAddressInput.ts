// File: lib/hooks/useDebouncedAddressInput.ts

'use client';

import { useHexInput } from './useHexInput';
import { useDebounce } from './useDebounce';

/**
 * Combines hex input filtering + debounced address string.
 */
export function useDebouncedAddressInput(debounceMs: number = 250) {
  const { inputValue, validateHexInput, clearInput } = useHexInput();
  const debouncedAddress = useDebounce(inputValue, debounceMs);

  return {
    inputValue,
    debouncedAddress,
    validateHexInput, // ⚠️ Already filters hex only input
    clearInput,
  };
}
