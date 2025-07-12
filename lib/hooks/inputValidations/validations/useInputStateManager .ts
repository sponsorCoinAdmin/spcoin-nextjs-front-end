// File: lib/hooks/inputValidations/validations/useInputStateManager.ts

'use client';

import { useEffect } from 'react';
import { InputState } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_INPUT_STATE_MANAGER === 'true';
const debugLog = createDebugLogger('useInputStateManager', DEBUG_ENABLED, LOG_TIME);

export interface InputStateManagerOptions {
  validHexInput: string;
  debouncedHexInput: string;
  setInputState: (state: InputState) => void;
  setValidatedAsset: (asset: ValidatedAsset | undefined) => void;
  resetHexInput: () => void;
  currentInputState: InputState;
}

export function useInputStateManager({
  validHexInput,
  debouncedHexInput,
  setInputState,
  setValidatedAsset,
  resetHexInput,
  currentInputState,
}: InputStateManagerOptions) {
  const terminalStates = [
    InputState.INVALID_HEX_INPUT,                  // invalid hex format → stop
    InputState.INCOMPLETE_ADDRESS,                 // incomplete address → stop
    InputState.INVALID_ADDRESS_INPUT,              // invalid address → stop
    InputState.DUPLICATE_INPUT_ERROR,              // duplicate → stop
    InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,   // no contract on-chain → stop
    InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY, // no local metadata → stop
    InputState.VALIDATE_BALANCE_ERROR,             // balance check failed → stop
    InputState.CLOSE_SELECT_SCROLL_PANEL,          // final close → end
  ];

  useEffect(() => {
    debugLog.log(`🔎 useInputStateManager triggered → validHexInput="${validHexInput}", debouncedHexInput="${debouncedHexInput}", currentInputState=${InputState[currentInputState]}`);

    if (!validHexInput || validHexInput.trim() === '') {
      debugLog.log('⏭️ Skipping: validHexInput is empty');
      return;
    }

    if (!debouncedHexInput || debouncedHexInput.trim() === '') {
      debugLog.log('⏭️ Skipping: debouncedHexInput is empty');
      return;
    }

    if (currentInputState === InputState.VALIDATE_ADDRESS) {
      debugLog.log('✅ Already in VALIDATE_ADDRESS — no update needed');
      return;
    }

    if (terminalStates.includes(currentInputState)) {
      debugLog.log(`🛑 Current state is terminal (${InputState[currentInputState]}) — no update`);
      return;
    }

    debugLog.log(`🔄 Setting inputState → VALIDATE_ADDRESS`);
    setInputState(InputState.VALIDATE_ADDRESS);
  }, [validHexInput, debouncedHexInput, setInputState, currentInputState]);

  const forceReset = () => {
    debugLog.log('🧹 forceReset called → clearing validated asset + input state');
    setValidatedAsset(undefined);
    resetHexInput();
    setInputState(InputState.EMPTY_INPUT);
  };

  const forceClose = () => {
    debugLog.log('❌ forceClose called → setting inputState to CLOSE_SELECT_SCROLL_PANEL');
    setInputState(InputState.CLOSE_SELECT_SCROLL_PANEL);
  };

  return {
    forceReset,
    forceClose,
  };
}
