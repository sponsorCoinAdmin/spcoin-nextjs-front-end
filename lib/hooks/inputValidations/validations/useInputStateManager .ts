// File: lib/hooks/inputValidations/useInputStateManager.ts

'use client';

/**
 * @internal
 * Do not use directly unless you have advanced needs.
 * Normally wired via usePanelContextBase.
 */

import { useEffect } from 'react';
import { InputState } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export interface InputStateManagerOptions {
  validHexInput: string;
  debouncedHexInput: string;
  setInputState: (state: InputState) => void;
  setValidatedAsset: (asset: ValidatedAsset | undefined) => void;
  resetHexInput: () => void;
}

export function useInputStateManager({
  validHexInput,
  debouncedHexInput,
  setInputState,
  setValidatedAsset,
  resetHexInput,
}: InputStateManagerOptions) {
  // Example: Always trigger validate on input change
  useEffect(() => {
    setInputState(InputState.VALIDATE_ADDRESS);
  }, [validHexInput, setInputState]);

  // Optional: Add more FSM actions here later

  // Expose optional manual actions
  const forceReset = () => {
    setValidatedAsset(undefined);
    resetHexInput();
    setInputState(InputState.EMPTY_INPUT);
  };

  const forceClose = () => {
    setInputState(InputState.CLOSE_SELECT_INPUT);
  };

  return {
    forceReset,
    forceClose,
  };
}
