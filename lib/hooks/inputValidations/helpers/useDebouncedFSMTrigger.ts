// File: lib/hooks/inputValidations/helpers/useDebouncedFSMTrigger.ts

'use client';

import { useEffect, useRef } from 'react';
import { InputState } from '@/lib/structure/assetSelection';
import { isTerminalFSMState } from '../FSM_Core/fSMInputStates';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useAssetSelectContext } from '@/lib/context/AssetSelectPanels/useAssetSelectContext';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('useDebouncedFSMTrigger', DEBUG_ENABLED, LOG_TIME);

export function useDebouncedFSMTrigger() {
  const {
    inputState,
    setInputState,
    debouncedHexInput,
    manualEntry,
  } = useAssetSelectContext();

  const inputStateRef = useRef<InputState>(inputState);
  const prevDebouncedInputRef = useRef<string>('');

  // Keep FSM state ref in sync
  useEffect(() => {
    inputStateRef.current = inputState;
  }, [inputState]);

  useEffect(() => {
    const currentFSM = inputStateRef.current;
    const inputChanged = debouncedHexInput !== prevDebouncedInputRef.current;
    const isTerminal = isTerminalFSMState(currentFSM);
    const isEmpty = currentFSM === InputState.EMPTY_INPUT;

    debugLog.log('🧪 [useDebouncedFSMTrigger] Debounce Watcher');
    debugLog.log('   ↪️ Previous:', prevDebouncedInputRef.current);
    debugLog.log('   ↪️ Current:', debouncedHexInput);
    debugLog.log('   🔄 Input Changed:', inputChanged);
    debugLog.log('   🧯 Current FSM State:', InputState[currentFSM]);
    debugLog.log('   ☠️ Is Terminal:', isTerminal);
    debugLog.log('   💭 Is EMPTY_INPUT:', isEmpty);
    debugLog.log('   👤 Manual Entry Flag:', manualEntry);

    if (!inputChanged) {
      debugLog.log('[FSM Trigger Blocked] 🔕 Input has not changed.');
      return;
    }

    if (!isTerminal && !isEmpty) {
      debugLog.warn(`[FSM Trigger Blocked] 🚫 FSM is busy or mid-validation. State: ${InputState[currentFSM]}`);
      return;
    }

    debugLog.log('🔁 [FSM RESTART TRIGGERED] → VALIDATE_ADDRESS');
    setInputState(InputState.VALIDATE_ADDRESS, 'useDebouncedFSMTrigger');
    prevDebouncedInputRef.current = debouncedHexInput;
  }, [debouncedHexInput]); // manualEntry intentionally omitted
}
