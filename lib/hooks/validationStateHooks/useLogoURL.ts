// File: lib/hooks/validationStateHooks/useLogoURL.ts

'use client';

import { useCallback } from 'react';
import { InputState } from '@/lib/structure';
import { setDebugInputState } from './useValidationStateManager';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('useLogoURL', DEBUG_ENABLED, LOG_TIME);

export function useLogoURL(
  debouncedAddress: string,
  inputState: InputState,
  setInputState: (s: InputState) => void,
  seenBrokenLogosRef: React.MutableRefObject<Set<string>>
) {
  const setDebugState = (state: InputState) => {
    setDebugInputState(debugLog, state, inputState, setInputState);
  };

  const reportMissingLogoURL = useCallback(() => {
    if (!debouncedAddress) return;
    if (!seenBrokenLogosRef.current.has(debouncedAddress)) {
      seenBrokenLogosRef.current.add(debouncedAddress);
      console.warn(`🛑 Missing logoURL image for ${debouncedAddress}`);
      setDebugState(InputState.CONTRACT_NOT_FOUND_LOCALLY);
    }
  }, [debouncedAddress, inputState, setInputState]);

  const hasBrokenLogoURL = useCallback(() => {
    return seenBrokenLogosRef.current.has(debouncedAddress);
  }, [debouncedAddress]);

  return {
    reportMissingLogoURL,
    hasBrokenLogoURL,
  };
}
