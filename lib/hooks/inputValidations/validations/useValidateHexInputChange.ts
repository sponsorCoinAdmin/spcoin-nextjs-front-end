// File: lib/hooks/inputValidations/useValidateHexInputChange.ts

'use client';

import { useCallback, useState } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useInputValidationState } from '@/lib/hooks/useInputValidationState';
import { FEED_TYPE, InputState } from '@/lib/structure';

export function useValidateHexInputChange(feedType: FEED_TYPE) {
  const [inputValue, setInputValue] = useState('');

  const debouncedAddress = useDebounce(inputValue || '', 250);

  const {
    inputState,
    setInputState,
    validatedAsset,
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useInputValidationState(debouncedAddress, feedType);

  const onChange = useCallback((val: string) => {
    setInputValue(val);
    setInputState(InputState.VALIDATE_INPUT); // trigger FSM
  }, [setInputState]);

  return {
    inputValue,
    debouncedAddress,
    onChange,
    inputState,
    validatedAsset,
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  };
}
