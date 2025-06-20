// File: lib/hooks/validationStateHooks/useValidationStateManager.ts

'use client';

import { useRef, useEffect } from 'react';
import { InputState, getInputStateString } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('useValidationStateManager', DEBUG_ENABLED, LOG_TIME);

export function debugSetInputState(
  state: InputState,
  currentState: InputState,
  setState: (s: InputState) => void
): void {
  if (state === currentState) return;
  const prevState = getInputStateString(currentState);
  const currState = getInputStateString(state);
  const currStateImgs = '⚠️'.repeat(state);
  debugLog.log(`${currStateImgs} STATE CHANGE: ${prevState}(${currentState}) -> ${currState}(${state})`);
  setState(state);
}

export function useValidationStateManager(
  debouncedAddress: string,
  inputState: InputState,
  setInputState: (s: InputState) => void
) {
  const seenBrokenLogosRef = useRef<Set<string>>(new Set());
  const previousAddressRef = useRef<string>('');
  const lastTokenAddressRef = useRef<string>('');

  useEffect(() => {
    const shouldReset =
      inputState === InputState.CONTRACT_NOT_FOUND_LOCALLY &&
      debouncedAddress !== previousAddressRef.current &&
      !seenBrokenLogosRef.current.has(debouncedAddress) &&
      !debouncedAddress.trim();

    if (shouldReset) {
      debugLog.log('🔁 Validation reset loop fix triggered', {
        debouncedAddress,
        prev: previousAddressRef.current,
        inputState,
        seenBroken: Array.from(seenBrokenLogosRef.current),
      });
      debugSetInputState(InputState.EMPTY_INPUT, inputState, setInputState);
    }

    previousAddressRef.current = debouncedAddress;
  }, [debouncedAddress, inputState]);

  return {
    seenBrokenLogosRef,
    previousAddressRef,
    lastTokenAddressRef,
  };
}
