// File: lib/hooks/inputValidations/useValidateHexInput.ts

'use client';

import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels';
import { InputState } from '@/lib/structure';
import { useEffect } from 'react';

export function useValidateHexInput() {
  const {
    debouncedHexInput,
    failedHexInput,
    handleHexInputChange,
    isValidHexInput,
    resetHexInput,
    validHexInput,
    setInputState,
  } = useSharedPanelContext();

  useEffect(() => {
    setInputState(InputState.VALIDATE_ADDRESS);
  }, [validHexInput, setInputState]);

  return {
    debouncedHexInput,
    failedHexInput,
    handleHexInputChange,
    isValidHexInput,
    resetHexInput,
    validHexInput,
  };
}
