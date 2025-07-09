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
): SharedPanelContextType {
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
      debugLog.log(`🚫 Skipping setValidatedAsset — already ${next.symbol || next.address}`);
      return;
    }
    debugLog.log(next
      ? `✅ setValidatedAsset → ${next.symbol || next.address}`
      : '🧹 Clearing validated asset'
    );
    setValidatedAssetRaw(next);
  };

  // ─── Hex‐input tracking ──────────────────────
  const {
    validHexInput,
    failedHexInput,
    isValidHexInput,
    resetHexInput,
    failedHexCount,
    // internal setters not exposed by default:
  } = useHexInput();

  // Hack: grab internal setters from another hook instance
  const { setValidHexValue, setFailedHexInput } = (() => {
    const tmp: any = useHexInput();
    return {
      setValidHexValue: tmp.__proto__?.setValidHexValue || tmp.setValidHexValue,
      setFailedHexInput: tmp.__proto__?.setFailedHexInput || tmp.setFailedHexInput,
    };
  })();

  const debouncedHexInput = useDebounce(validHexInput, 250);

  const handleHexInputChange = (raw: string) => {
    const ok = isValidHexInput(raw);
    setValidHexValue(raw);
    if (!ok) setFailedHexInput(raw);
  };

  // ─── Debug dump helper ──────────────────────
  const dumpSharedPanelContext = () => {
    console.group(`🔍 dumpSharedPanelContext (${label})`);
    console.log('inputState:', getInputStateString(inputState), inputState);
    console.log('validatedAsset:', validatedAsset);
    console.log('validHexInput:', validHexInput);
    console.log('failedHexInput:', failedHexInput);
    console.log('failedHexCount:', failedHexCount);
    console.log('debouncedHexInput:', debouncedHexInput);
    console.log('feedType:', feedType);
    console.log('containerType:', containerType);
    console.groupEnd();
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

      // debug
      dumpSharedPanelContext,
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
    ]
  );

  return contextValue;
}
