import { useRef } from 'react';
import { useHexInput } from './useHexInput';
import { useDebounce } from './useDebounce';

/**
 * Combines hex input + debounced value + manual entry tracking.
 */
export function useDebouncedAddressInput(debounceMs: number = 250) {
  const { inputValue, validateHexInput, clearInput } = useHexInput();
  const debouncedAddress = useDebounce(inputValue, debounceMs);
  const manualEntryRef = useRef(false);

  const handleChange = (val: string) => {
    manualEntryRef.current = true;
    validateHexInput(val);
  };

  return {
    inputValue,
    debouncedAddress,
    onChange: handleChange,
    clearInput,
    validateHexInput,
    manualEntryRef,
  };
}
