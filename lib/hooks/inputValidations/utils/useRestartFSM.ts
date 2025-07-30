// File: lib/hooks/inputValidations/utils/useRestartFSM.ts

'use client';

import { useEffect, useRef } from 'react';
import { InputState } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugFSM = createDebugLogger('useRestartFSMIfNeeded', DEBUG_ENABLED, LOG_TIME);

/**
 * Restarts the FSM whenever the debounced input changes:
 * - Goes to VALIDATE_ADDRESS if input is non-empty
 * - Goes to EMPTY_INPUT if input is empty
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
    const trimmed = debouncedInput.trim();

    debugFSM.log(
      `🔁 useRestartFSMIfNeeded → changed=${changed}, prev="${prev}", current="${debouncedInput}"`
    );

    if (changed) {
      if (trimmed === '') {
        debugFSM.log(`🔄 FSM reset → EMPTY_INPUT`);
        setInputState(InputState.EMPTY_INPUT);
      } else {
        debugFSM.log(`🔄 FSM reset → VALIDATE_ADDRESS`);
        setInputState(InputState.VALIDATE_ADDRESS);
      }
    }

    prevDebouncedRef.current = debouncedInput;
  }, [debouncedInput, setInputState]);
}
