// File: lib/context/ScrollSelectPanels/usePanelContextBase.ts

'use client';

import { useState, useMemo } from 'react';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { InputState, getInputStateString, FEED_TYPE, CONTAINER_TYPE } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import type { SharedPanelContextType } from './useSharedPanelContext';
import { useInputStateManager } from '@/lib/hooks/inputValidations';

const LOG_TIME = false;

export function usePanelContextBase(
  feedType: FEED_TYPE,
  containerType: CONTAINER_TYPE,
  label: string,
  debugEnabled: boolean = false
): SharedPanelContextType {
  const debugLog = createDebugLogger(label, debugEnabled, LOG_TIME);

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
      debugLog.log(`🚫 Skipping setValidatedAsset — already ${next.symbol || next.address}`);
      return;
    }
    debugLog.log(
      next ? `✅ setValidatedAsset → ${next.symbol || next.address}` : '🧹 Clearing validated asset'
    );
    setValidatedAssetRaw(next);
  };

  const {
    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange,
    resetHexInput,
  } = useHexInput();

  // ─── Mount the state manager ────────────────────────
  const { forceReset, forceClose } = useInputStateManager({
    validHexInput,
    debouncedHexInput,
    setInputState,
    setValidatedAsset,
    resetHexInput,
  });

  const dumpFSMContext = () => {
    console.group(`[FSM Context] (${label})`);
    console.log({
      inputState: getInputStateString(inputState),
      validatedAsset,
      containerType,
      feedType,
    });
    console.groupEnd();
  };

  const dumpInputFeedContext = () => {
    console.group(`[InputFeed Context] (${label})`);
    console.log({
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
    });
    console.groupEnd();
  };

  const dumpPanelContext = () => {
    console.group(`[Panel Context] (${label})`);
    dumpFSMContext();
    dumpInputFeedContext();
    console.groupEnd();
  };

  return useMemo<SharedPanelContextType>(
    () => ({
      // FSM context
      inputState,
      setInputState,
      validatedAsset,
      setValidatedAsset,
      containerType,
      feedType,
      dumpFSMContext,

      // Input feed context
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChange,
      resetHexInput,
      dumpInputFeedContext,

      // Combined
      dumpPanelContext,

      // Manager actions
      forceReset,
      forceClose,
    }),
    [
      inputState,
      validatedAsset,
      containerType,
      feedType,
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChange,
      resetHexInput,
      forceReset,
      forceClose,
    ]
  );
}
