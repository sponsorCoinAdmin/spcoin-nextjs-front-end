'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// Setup logger
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_HEX_INPUT === 'true';
const debugLog = createDebugLogger('useHexInput', DEBUG_ENABLED, LOG_TIME);

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
      const trimmedInput = rawInput.trim();
      const ok = _isValidHexString(trimmedInput);

      debugLog.log('🖊️ handleHexInputChange called with:', trimmedInput, _isManual, '→ isValid:', ok);

      setIsValid(ok);

      if (ok) {
        debugLog.log('✅ Setting validHexInput to:', trimmedInput);
        setValidHexInput(trimmedInput);
        setFailedHexInput(undefined);
        setFailedHexCount(0);
      } else {
        debugLog.log('❌ Invalid input, setting failedHexInput to:', trimmedInput);
        setFailedHexInput(trimmedInput);
        setFailedHexCount((prev) => prev + 1);
      }

      return ok;
    },
    []
  );

  const resetHexInput = useCallback(() => {
    debugLog.log('🔄 Resetting hex input state');
    setValidHexInput('');
    setFailedHexInput(undefined);
    setFailedHexCount(0);
    setIsValid(true);
  }, []);

  const debouncedHexInput =
    debounceDelay === 0 ? validHexInput : useDebounce(validHexInput, debounceDelay);

  return {
    validHexInput,
    debouncedHexInput,
    handleHexInputChange,
    isValid,
    resetHexInput,
    failedHexInput,
    failedHexCount,
    isValidHexString,
  };
}
