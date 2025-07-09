// File: lib/context/ScrollSelectPanels/usePanelContextBase.ts
'use client';

import { useState, useMemo } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useHexInput } from '@/lib/hooks/useHexInput';
import {
  InputState,
  getInputStateString,
  FEED_TYPE,
  CONTAINER_TYPE,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import type { SharedPanelContextType } from './SharedPanelContext'; 

const LOG_TIME = false;

export function usePanelContextBase(
  feedType: FEED_TYPE,
  containerType: CONTAINER_TYPE,
  label: string,
  debugEnabled: boolean = false
) {
  const debugLog = createDebugLogger(label, debugEnabled, LOG_TIME);

  // ─── FSM core state ──────────────────────────
  const [validatedAsset, setValidatedAssetRaw] = useState<ValidatedAsset | undefined>();
  const [inputState, setInputStateRaw] = useState<InputState>(InputState.EMPTY_INPUT);

  const setInputState = (next: InputState) => {
    if (next === inputState) {
      debugLog.log(`🚫 Skipping setInputState — already in ${getInputStateString(next)}`);
      return;
    }
    debugLog.log(`📝 setInputState → ${getInputStateString(next)}`);
    setInputStateRaw(next);
  };

  const setValidatedAsset = (next: ValidatedAsset | undefined) => {
    if (validatedAsset && next && validatedAsset.address === next.address) {
      debugLog.log(`🚫 Skipping setValidatedAsset — already ${next.symbol}`);
      return;
    }
    debugLog.log(next ? `✅ setValidatedAsset → ${next.symbol}` : '🧹 Clearing validated asset');
    setValidatedAssetRaw(next);
  };

  // ─── Hex‐input tracking ──────────────────────
  const {
    validHexInput,
    failedHexInput,
    isValidHexInput,
    resetHexInput,
    failedHexCount,
    // these two setters aren’t returned by default, so we grab them by shadowing the hook’s internals:
  } = useHexInput();

  // We need the raw setters from useHexInput – so grab them out of the hook closure:
  const { setValidHexValue, setFailedHexInput } = ((): any => {
    // hack: pull the internal setters
    const tmp = useHexInput() as any;
    return {
      setValidHexValue: tmp.__proto__.setValidHexValue || tmp.setValidHexValue,
      setFailedHexInput: tmp.__proto__.setFailedHexInput || tmp.setFailedHexInput,
    };
  })();

  const debouncedHexInput = useDebounce(validHexInput, 250);

  const handleHexInputChange = (raw: string) => {
    const ok = isValidHexInput(raw);
    setValidHexValue(raw);
    if (!ok) setFailedHexInput(raw);
  };

  // ─── bundle it all ─────────────────────────
  const contextValue = useMemo<SharedPanelContextType>(
    () => ({
      // FSM bits
      inputState,
      setInputState,
      validatedAsset,
      setValidatedAsset,

      // identity
      feedType,
      containerType,

      // hex‐input
      validHexInput,
      failedHexInput,
      failedHexCount,
      isValidHexInput,
      resetHexInput,
      setValidHexInput: setValidHexValue,
      setFailedHexInput,

      // debounced
      debouncedHexInput,

      // convenience
      handleHexInputChange,
    }),
    [
      inputState,
      validatedAsset,
      feedType,
      containerType,
      validHexInput,
      failedHexInput,
      failedHexCount,
      isValidHexInput,
      resetHexInput,
      debouncedHexInput,
      // Note: setValidHexValue & setFailedHexInput are stable
    ]
  );

  return contextValue;
}
