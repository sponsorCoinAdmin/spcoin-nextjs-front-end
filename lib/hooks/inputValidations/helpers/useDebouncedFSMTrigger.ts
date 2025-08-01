'use client';

import { useEffect, useRef } from 'react';
import { InputState, getInputStateString } from '@/lib/structure';
import { isTerminalFSMState } from '../FSM_Core/fSMInputStates';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('useDebouncedFSMTrigger', DEBUG_ENABLED, LOG_TIME);

interface Props {
  debouncedHexInput: string;
  manualEntry: boolean;
}

export function useDebouncedFSMTrigger({ debouncedHexInput, manualEntry }: Props) {
  const { inputState, setInputState } = useSharedPanelContext();
  const inputStateRef = useRef(inputState);
  const prevDebouncedInputRef = useRef('');

  useEffect(() => {
    inputStateRef.current = inputState;
  }, [inputState]);

  useEffect(() => {
    const inputChanged = debouncedHexInput !== prevDebouncedInputRef.current;
    const isTerminal = isTerminalFSMState(inputStateRef.current);
    const isEmpty = inputStateRef.current === InputState.EMPTY_INPUT;

    debugLog.log('🧪 [useDebouncedFSMTrigger] Debounce Watcher');
    debugLog.log('   ↪️ Previous:', prevDebouncedInputRef.current);
    debugLog.log('   ↪️ Current:', debouncedHexInput);
    debugLog.log('   🔄 Input Changed:', inputChanged);
    debugLog.log('   🧯 Current FSM State:', getInputStateString(inputStateRef.current));
    debugLog.log('   ☠️ Is Terminal:', isTerminal);
    debugLog.log('   💭 Is EMPTY_INPUT:', isEmpty);
    debugLog.log('   👤 Manual Entry Flag:', manualEntry);

    if (!inputChanged) {
      debugLog.log('[FSM Trigger Blocked] 🔕 Input has not changed.');
      return;
    }

    if (isEmpty) {
      debugLog.log('🔁 [FSM Triggered] EMPTY_INPUT + input changed → VALIDATE_ADDRESS');
      setInputState(InputState.VALIDATE_ADDRESS);
      prevDebouncedInputRef.current = debouncedHexInput;
      return;
    }

    if (!isTerminal) {
      debugLog.log(`[FSM Trigger Blocked] 🚫 FSM state is not terminal. Current: ${getInputStateString(inputStateRef.current)}`);
      return;
    }

    debugLog.log('🔁 [FSM RESTART TRIGGERED] → VALIDATE_ADDRESS');
    setInputState(InputState.VALIDATE_ADDRESS);
    prevDebouncedInputRef.current = debouncedHexInput;
  }, [debouncedHexInput, manualEntry]);
}
