// File: lib/context/ScrollSelectPanels/usePanelContextBase.ts

'use client';

import { useState, useMemo } from 'react';
import { useHexInput } from '@/lib/hooks/useHexInput';
import {
  InputState,
  getInputStateString,
  FEED_TYPE,
  SP_COIN_DISPLAY,
  TokenContract,
} from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import type { SharedPanelContextType } from './useSharedPanelContext';

const LOG_TIME = false;

export function usePanelContextBase(
  feedType: FEED_TYPE,
  containerType: SP_COIN_DISPLAY,
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

  const dumpFSMContext = (headerInfo?: string) => {
    try {
      debugLog.log(`🧩 dumpFSMContext called${headerInfo ? ` → ${headerInfo}` : ''}`);
      console.group(`[FSM Context Dump] (${label})`);
      if (headerInfo) console.log(`📝 ${headerInfo}`);
      console.log({
        inputState: getInputStateString(inputState),
        validatedAsset,
        containerType,
        feedType,
      });
      console.groupEnd();
    } catch (err) {
      console.warn('⚠️ dumpFSMContext failed:', err);
    }
  };

  const dumpInputFeedContext = (headerInfo?: string) => {
    try {
      debugLog.log(`💬 dumpInputFeedContext called${headerInfo ? ` → ${headerInfo}` : ''}`);
      console.group(`[InputFeed Context Dump] (${label})`);
      if (headerInfo) console.log(`📝 ${headerInfo}`);
      console.log({
        validHexInput,
        debouncedHexInput,
        failedHexInput,
        failedHexCount,
        isValid,
      });
      console.groupEnd();
    } catch (err) {
      console.warn('⚠️ dumpInputFeedContext failed:', err);
    }
  };

  const dumpSharedPanelContext = (headerInfo?: string) => {
    try {
      debugLog.log(`🛠 dumpSharedPanelContext called${headerInfo ? ` → ${headerInfo}` : ''}`);
      console.group(`[Panel Context Dump] (${label})`);
      if (headerInfo) console.log(`📝 ${headerInfo}`);
      dumpFSMContext();
      dumpInputFeedContext();
      console.groupEnd();
    } catch (err) {
      console.warn('⚠️ dumpSharedPanelContext failed:', err);
    }
  };

  return useMemo<SharedPanelContextType>(
    () => ({
      inputState,
      setInputState,
      validatedAsset,
      setValidatedAsset,
      containerType,
      feedType,
      dumpFSMContext,
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChange,
      resetHexInput,
      dumpInputFeedContext,
      dumpSharedPanelContext,

      /** ✅ Required callbacks, supplied as no-ops for base context use */
      closeCallback: () => {
        debugLog.warn('⚠️ closeCallback (noop) was called from panelContextBase');
      },
      setTradingTokenCallback: (token: TokenContract) => {
        debugLog.warn('⚠️ setTradingTokenCallback (noop) was called with token:', token);
      },
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
    ]
  );
}
