// File: lib/hooks/validationStateHooks/useLogoFallback.ts

'use client';

import { useCallback } from 'react';
import { InputState, getInputStateString } from '@/lib/structure';
import { debugSetInputState } from './useValidationStateManager';

export function useLogoFallback(
  debouncedAddress: string,
  inputState: InputState,
  setInputState: (s: InputState) => void,
  seenBrokenLogosRef: React.MutableRefObject<Set<string>>
) {
  const reportMissingLogoURL = useCallback(() => {
    if (!debouncedAddress) return;
    if (!seenBrokenLogosRef.current.has(debouncedAddress)) {
      seenBrokenLogosRef.current.add(debouncedAddress);
      console.warn(`🛑 Missing logoURL image for ${debouncedAddress}`);
      debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY, inputState, setInputState);
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
