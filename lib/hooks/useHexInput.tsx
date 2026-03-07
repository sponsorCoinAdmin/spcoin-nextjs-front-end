'use client';

import { useState, useCallback, useMemo } from 'react';
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
    /^0x$/i.test(trimmed) ||
    /^0x[0-9a-fA-F]*$/i.test(trimmed)
  );
};

export function useHexInput(initialValue = '', debounceDelay = 250) {
  const [validHexInput, setValidHexInput] = useState(initialValue);
  const [failedHexInput, setFailedHexInput] = useState<string | undefined>(undefined);
  const [failedHexCount, setFailedHexCount] = useState(0);
  const [isValid, setIsValid] = useState(true);

  const isValidHexString = useCallback((rawInput: string): boolean => {
    return _isValidHexString(rawInput);
  }, []);

  const handleHexInputChange = useCallback((rawInput: string) => {
    const trimmedInput = rawInput.trim();
    const ok = _isValidHexString(trimmedInput);

    debugLog.log('🖊️ handleHexInputChange called with:', trimmedInput, '→ isValid:', ok);

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
  }, []);

  const resetHexInput = useCallback(() => {
    debugLog.log('🔄 Resetting hex input state');
    setValidHexInput('');
    setFailedHexInput(undefined);
    setFailedHexCount(0);
    setIsValid(true);
  }, []);

  // ✅ Always call the hook; when delay <= 0, debounce is effectively disabled.
  const effectiveDelay = useMemo(
    () => (Number.isFinite(debounceDelay) && debounceDelay > 0 ? debounceDelay : 0),
    [debounceDelay]
  );
  const debouncedHexInput = useDebounce(validHexInput, effectiveDelay);

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
