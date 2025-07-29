// File: lib/hooks/inputValidations/helpers/useDebouncedFSMTrigger.ts

import { useEffect, useRef } from 'react';
import { InputState } from '@/lib/structure';
import { isTerminalFSMState } from '../FSM_Core/fSMInputStates';
import { createDebugLogger } from '@/lib/utils/debugLogger';

interface Props {
  debouncedHexInput: string;
  inputState: InputState;
  setInputState: (state: InputState) => void;
}

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('useFSMExecutor', DEBUG_ENABLED, LOG_TIME);

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

    debugLog.log('🔎 Debounce Watcher', {
      prevDebounced: prevDebouncedInputRef.current,
      currentDebounced: debouncedHexInput,
      inputChanged,
      inputState: InputState[inputStateRef.current],
      isTerminal,
    });

    if (inputChanged && isTerminal) {
      debugLog.log('🔁 [RESTART FSM FROM TERMINAL] → VALIDATE_ADDRESS');
      setInputState(InputState.VALIDATE_ADDRESS);
      prevDebouncedInputRef.current = debouncedHexInput;
    }
  }, [debouncedHexInput, setInputState]);
}
