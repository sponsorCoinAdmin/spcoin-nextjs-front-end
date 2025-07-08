// File: lib/hooks/inputValidations/validations/useValidateHexInput.ts

'use client';

import { useCallback, useEffect } from 'react';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { FEED_TYPE, InputState } from '@/lib/structure';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/SharedPanelContext';

export function useValidateHexInput(feedType: FEED_TYPE) {
  const {
    inputValue,
    validateHexInput,
    resetInput: resetHexInput,
    failedHexInput,
    failedHexCount,
  } = useHexInput();

  const { containerType, inputState, setInputState } = useSharedPanelContext(); // ✅ Get containerType from context
  const debouncedAddress = useDebounce(inputValue, 250);

  useEffect(() => {
  console.log(`🧪 useValidateHexInput: setInputState(VA) called for "${debouncedAddress}"`);
  setInputState(InputState.VALIDATE_ADDRESS);
}, [debouncedAddress]);

  // --- Handle input change: validate + spawn FSM ---
  const handleHexInputChange = useCallback(
    (val: string, _isManual?: boolean) => {
      validateHexInput(val);
      // alert(`hex input changed ${val}`)
      // setInputState(InputState.VALIDATE_ADDRESS);
    },
    [validateHexInput, setInputState]
  );

  useEffect(() => {
    alert(`useEffect debouncedAddress Input: "${debouncedAddress}"`);
    setInputState(InputState.VALIDATE_ADDRESS);
  }, [debouncedAddress]);

  // --- Handle reset ---
  const resetInput = useCallback(() => {
    resetHexInput(); // clears local input state
    setInputState(InputState.EMPTY_INPUT); // resets FSM
  }, [resetHexInput, setInputState]);

  // --- Alert on failed input ---
  useEffect(() => {
    if (typeof failedHexInput === 'string' && failedHexCount > 0) {
      alert(`Invalid Hex Input: "${failedHexInput}"`);
    }
  }, [failedHexCount, failedHexInput]);

  return {
    inputValue,
    debouncedAddress,
    inputState,             // ✅ include for consumers like AddressSelect
    setInputState,          // ✅ include for consumers like AddressSelect
    handleHexInputChange,
    resetInput,
    failedHexInput,
    failedHexCount,
  };
}
