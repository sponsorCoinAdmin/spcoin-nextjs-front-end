// File: lib/hooks/inputValidations/helpers/useDebouncedFSMTrigger.ts

import { useEffect, useRef } from 'react';
import { InputState, getInputStateString } from '@/lib/structure';
import { isTerminalFSMState } from '../FSM_Core/fSMInputStates';
import { createDebugLogger } from '@/lib/utils/debugLogger';

interface Props {
  debouncedHexInput: string;
  inputState: InputState;
  setInputState: (state: InputState) => void;
}

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('useDebouncedFSMTrigger', DEBUG_ENABLED, LOG_TIME);

export function useDebouncedFSMTrigger({
  debouncedHexInput,
  inputState,
  setInputState,
}: Props) {
  const inputStateRef = useRef(inputState);
  inputStateRef.current = inputState;

  const prevDebouncedInputRef = useRef('');

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

    if (!inputChanged) {
      // alert('[FSM Trigger Blocked] 🔕 Input has not changed.');
      debugLog.log('[FSM Trigger Blocked] 🔕 Input has not changed.');
      return;
    }

    if (isEmpty) {
      // debugLog.log('🔁 [FSM Triggered] EMPTY_INPUT + input changed → VALIDATE_ADDRESS');
      setInputState(InputState.VALIDATE_ADDRESS);
      prevDebouncedInputRef.current = debouncedHexInput;
      return;
    }

    if (!isTerminal) {
      // alert(`[FSM Trigger Blocked] 🚫 FSM state is not terminal. Current: ${getInputStateString(inputStateRef.current)}`);
      debugLog.log(`[FSM Trigger Blocked] 🚫 FSM state is not terminal. Current: ${getInputStateString(inputStateRef.current)}`);
      return;
    }

    // Default case: input changed AND terminal
    debugLog.log('🔁 [FSM RESTART TRIGGERED] → VALIDATE_ADDRESS');
    // alert('🔁 [FSM Triggered] Debounced input changed from terminal state → VALIDATE_ADDRESS');
    debugLog.log('🔁 [FSM Triggered] Debounced input changed from terminal state → VALIDATE_ADDRESS');
    setInputState(InputState.VALIDATE_ADDRESS);
    prevDebouncedInputRef.current = debouncedHexInput;
  }, [debouncedHexInput, inputState, setInputState]);
}
