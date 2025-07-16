// File: lib/context/ScrollSelectPanels/usePanelContextBase.ts

'use client';

import { useState, useMemo } from 'react';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { InputState, getInputStateString, FEED_TYPE, CONTAINER_TYPE } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import type { SharedPanelContextType } from './useSharedPanelContext';

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
  const [manualEntry, setManualEntry] = useState<boolean>(true);

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
    debugLog.log(next ? `✅ setValidatedAsset → ${next.symbol || next.address}` : '🧹 Clearing validated asset');
    setValidatedAssetRaw(next);
  };

  const handleHexInputChangeWithManualFlag = (input: string, isManual = true) => {
    setManualEntry(isManual);
    return handleHexInputChange(input);
  };

  const dumpFSMContext = (headerInfo?: string) => {
    debugLog.log(`🧩 dumpFSMContext${headerInfo ? ` → ${headerInfo}` : ''}`);
    console.group(`[FSM Context Dump] (${label})`);
    console.log({ inputState: getInputStateString(inputState), validatedAsset, containerType, feedType, manualEntry });
    console.groupEnd();
  };

  const dumpInputFeedContext = (headerInfo?: string) => {
    debugLog.log(`💬 dumpInputFeedContext${headerInfo ? ` → ${headerInfo}` : ''}`);
    console.group(`[InputFeed Context Dump] (${label})`);
    console.log({ validHexInput, debouncedHexInput, failedHexInput, failedHexCount, isValid });
    console.groupEnd();
  };

  const dumpSharedPanelContext = (headerInfo?: string) => {
    debugLog.log(`🛠 dumpSharedPanelContext${headerInfo ? ` → ${headerInfo}` : ''}`);
    console.group(`[Panel Context Dump] (${label})`);
    dumpFSMContext();
    dumpInputFeedContext();
    console.groupEnd();
  };

  return useMemo<SharedPanelContextType>(
    () => ({
      inputState,
      setInputState,
      validatedAsset,
      setValidatedAsset,
      containerType,
      feedType,
      manualEntry,
      setManualEntry,
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChange: handleHexInputChangeWithManualFlag,
      resetHexInput,
      dumpFSMContext,
      dumpInputFeedContext,
      dumpSharedPanelContext,
    }),
    [
      inputState,
      validatedAsset,
      containerType,
      feedType,
      manualEntry,
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChangeWithManualFlag,
      resetHexInput,
    ]
  );
}
