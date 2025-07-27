// File: lib/hooks/inputValidations/utils/useRestartFSM.ts

'use client';

import { useEffect, useRef } from 'react';
import { InputState } from '@/lib/structure';
import { isTerminalFSMState } from '@/lib/hooks/inputValidations/FSM_Core/terminalStates';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_INPUT_STATE_MANAGER === 'true';
const debugFSM = createDebugLogger('useRestartFSMIfNeeded', DEBUG_ENABLED, LOG_TIME);

/**
 * Restarts the FSM by setting it to VALIDATE_ADDRESS
 * when a new debounced input is received after reaching a terminal state.
 */
export function useRestartFSMIfNeeded(
  inputState: InputState,
  debouncedInput: string,
  setInputState: (s: InputState) => void
) {
  const prevDebouncedRef = useRef<string>('');

  useEffect(() => {
    const prev = prevDebouncedRef.current;
    const changed = prev !== debouncedInput;
    const shouldRestart = isTerminalFSMState(inputState) && changed && debouncedInput;

    debugFSM.log(
      `🔁 useRestartFSMIfNeeded → changed=${changed} terminal=${isTerminalFSMState(inputState)} input="${debouncedInput}"`
    );

    if (shouldRestart) {
      debugFSM.log(`🔄 Restarting FSM → VALIDATE_ADDRESS`);
      setInputState(InputState.VALIDATE_ADDRESS);
    }

    prevDebouncedRef.current = debouncedInput;
  }, [debouncedInput, inputState, setInputState]);
}
