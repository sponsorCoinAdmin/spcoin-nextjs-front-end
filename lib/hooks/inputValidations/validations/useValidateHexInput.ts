// File: lib/hooks/inputValidations/validations/useValidateHexInput.ts

'use client';

import { useCallback, useEffect } from 'react';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { InputState } from '@/lib/structure';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/SharedPanelContext';

export function useValidateHexInput() {

  const { inputState, setInputState } = useSharedPanelContext(); // ✅ Get containerType from context

  const {
    validHexInput,
    failedHexInput,
    isValidHexInput,
    resetHexInput,
    failedHexCount,
  } = useHexInput();

  const debouncedHexInput = useDebounce(validHexInput, 250);

  useEffect(() => {
    console.log(`🧪 useValidateHexInput: setInputState(VA) called for "${debouncedHexInput}"`);
    setInputState(InputState.VALIDATE_ADDRESS);
  }, [debouncedHexInput]);

  // --- Handle input change: validate + spawn FSM ---
  const handleHexInputChange = useCallback(
    (val: string, _isManual?: boolean) => {
      isValidHexInput(val);
      // alert(`hex input changed ${val}`)
    },
    [isValidHexInput, setInputState]
  );

  useEffect(() => {
    alert(`useEffect debouncedHexInput Input: "${debouncedHexInput}"`);
    setInputState(InputState.VALIDATE_ADDRESS);
  }, [debouncedHexInput]);

  // --- Alert on failed input ---
  useEffect(() => {
    if (typeof failedHexInput === 'string' && failedHexCount > 0) {
      alert(`Invalid Hex Input: "${failedHexInput}"`);
    }
  }, [failedHexCount, failedHexInput]);

  return {
    validHexInput,
    handleHexInputChange,
    resetHexInput,
    failedHexInput,
  };
}
