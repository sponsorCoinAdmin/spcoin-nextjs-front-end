// File: lib/hooks/inputValidations/validations/useValidateHexInput.ts

'use client';

import { useCallback, useEffect } from 'react';
import { InputState } from '@/lib/structure';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/SharedPanelContext';

export function useValidateHexInput() {
  const {
    // hex‐input state & setters from context
    validHexInput,
    debouncedHexInput,
    isValidHexInput,
    setValidHexInput,
    setFailedHexInput,
    // FSM trigger
    setInputState,
  } = useSharedPanelContext();

  // 1) Handle each keystroke immediately
  const handleHexInputChange = useCallback(
    (raw: string, _isManual?: boolean) => {
      const ok = isValidHexInput(raw);
      setValidHexInput(raw);
      if (!ok) {
        setFailedHexInput(raw);
      }
      // we don’t fire the FSM here; that waits for the debounced value
    },
    [isValidHexInput, setValidHexInput, setFailedHexInput]
  );

  // 2) Once the debounced value settles, kick off the FSM
  useEffect(() => {
    setInputState(InputState.VALIDATE_ADDRESS);
  }, [debouncedHexInput, setInputState]);

  return {
    validHexInput,
    debouncedHexInput,
    handleHexInputChange,
  };
}
