// File: lib/hooks/inputValidations/validations/useInputStateManager.ts

'use client';

import { useEffect } from 'react';
import { InputState } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_INPUT_STATE_MANAGER === 'true';
const debugLog = createDebugLogger('useInputStateManager', DEBUG_ENABLED, LOG_TIME);

export function useInputStateManager() {
  const sharedContext = useSharedPanelContext();
  const {
    validHexInput,
    debouncedHexInput,
    setInputState,
    setValidatedAsset,
    resetHexInput,
    inputState: currentInputState,
    manualEntry,
  } = sharedContext;

  const terminalStates = [
    InputState.INVALID_HEX_INPUT,
    InputState.INCOMPLETE_ADDRESS,
    InputState.INVALID_ADDRESS_INPUT,
    InputState.DUPLICATE_INPUT_ERROR,
    InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
    InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,
    InputState.VALIDATE_BALANCE_ERROR,
  ];

  useEffect(() => {
    debugLog.log('🛠️ useInputStateManager mounted → dumping shared panel context');
    sharedContext.dumpSharedPanelContext('full dump from useInputStateManager');
    debugLog.log(`🔎 Triggered → validHexInput="${validHexInput}", debouncedHexInput="${debouncedHexInput}", currentInputState=${InputState[currentInputState]}, manualEntry=${manualEntry}`);

    if (!validHexInput.trim()) {
      debugLog.log('⏭️ Skipping: validHexInput is empty');
      return;
    }

    if (!debouncedHexInput.trim()) {
      debugLog.log('⏭️ Skipping: debouncedHexInput is empty');
      return;
    }

    if (currentInputState === InputState.VALIDATE_ADDRESS) {
      debugLog.log('✅ Already in VALIDATE_ADDRESS — no update needed');
      return;
    }

    if (terminalStates.includes(currentInputState)) {
      debugLog.log(`🛑 Terminal state (${InputState[currentInputState]}) — no update`);
      return;
    }

    debugLog.log(`🔄 Setting inputState → VALIDATE_ADDRESS`);
    setInputState(InputState.VALIDATE_ADDRESS);
  }, [validHexInput, debouncedHexInput, setInputState, currentInputState, manualEntry]);

  const forceReset = () => {
    debugLog.log('🧹 forceReset called → clearing validated asset + input state');
    setValidatedAsset(undefined);
    resetHexInput();
    setInputState(InputState.EMPTY_INPUT);
  };

  const forceClose = () => {
    debugLog.log('🚨 forceClose() called in useInputStateManager');
    sharedContext.dumpFSMContext('before forceClose check');

    if (manualEntry) {
      debugLog.log('⏭️ forceClose skipped → manualEntry is true, keeping panel open');
      return;
    }

    debugLog.log('❌ forceClose proceeding → setting inputState to CLOSE_SELECT_SCROLL_PANEL');
    setInputState(InputState.CLOSE_SELECT_SCROLL_PANEL);
  };

  return {
    forceReset,
    forceClose,
  };
}
