'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { FEED_TYPE, InputState } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_HEX_INPUT === 'true';
const debugLog = createDebugLogger('useValidateHexInputChange', DEBUG_ENABLED, false);

export function useValidateHexInputChange(feedType: FEED_TYPE) {
  const [inputValue, setInputValue] = useState('');
  const manualEntryRef = useRef(false);

  const debouncedAddress = useDebounce(inputValue || '', 250);

  const {
    inputState,
    setInputState,
    validatedAsset,
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useInputValidationState(debouncedAddress, feedType);

  const onChange = useCallback(
    (val: string, isManual?: boolean) => {
      if (isManual) {
        manualEntryRef.current = true;
      }
      debugLog.log(`📝 onChange(): raw="${val}", manual=${isManual}`);
      setInputValue(val);
      setInputState(InputState.VALIDATE_INPUT); // trigger FSM
    },
    [setInputState]
  );

  useEffect(() => {
    debugLog.log(`⏳ debouncedAddress = "${debouncedAddress}"`);
  }, [debouncedAddress]);

  return {
    inputValue,
    debouncedAddress,
    onChange,
    inputState,
    validatedAsset,
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
    manualEntryRef,
  };
}
