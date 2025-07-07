// File: lib/hooks/inputValidations/validations/useValidateHexInput.ts

'use client';

import { useCallback, useEffect } from 'react';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';
import { FEED_TYPE, CONTAINER_TYPE, InputState } from '@/lib/structure';
import { usePanelFeedContext } from '@/lib/context/ScrollSelectPanels';

export function useValidateHexInput(feedType: FEED_TYPE) {
  const {
    inputValue,
    validateHexInput,
    resetInput: resetHexInput,
    failedHexInput,
    failedHexCount,
  } = useHexInput();

  const { containerType } = usePanelFeedContext(); // ✅ Get containerType from context
  const debouncedAddress = useDebounce(inputValue, 250);

  const {
    inputState,
    setInputState,
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useValidateFSMInput(debouncedAddress, feedType, containerType); // ✅ Pass containerType here

  // --- Handle input change: validate + spawn FSM ---
  const handleHexInputChange = useCallback(
    (val: string, _isManual?: boolean) => {
      validateHexInput(val);
      setInputState(InputState.VALIDATE_ADDRESS);
    },
    [validateHexInput, setInputState]
  );

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
    isLoading,
    reportMissingLogoURL,
    hasBrokenLogoURL,
    resetInput,
    failedHexInput,
    failedHexCount,
  };
}
