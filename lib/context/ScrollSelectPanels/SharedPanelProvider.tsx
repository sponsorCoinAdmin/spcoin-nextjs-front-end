// File: lib/context/ScrollSelectPanels/SharedPanelProvider.tsx

'use client';

import React, { ReactNode, useState, useCallback } from 'react';
import { SharedPanelContext } from './useSharedPanelContext';
import { CONTAINER_TYPE, FEED_TYPE, InputState } from '@/lib/structure';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const debugLog = createDebugLogger('SharedPanelProvider', DEBUG_ENABLED, LOG_TIME);

export const SharedPanelProvider = ({ children }: { children: ReactNode }) => {
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAsset] = useState<any>(undefined);
  const [validHexInput, setValidHexInput] = useState<string>('');
  const [failedHexInput, setFailedHexInput] = useState<string>('');
  const [failedHexCount, setFailedHexCount] = useState<number>(0);
  const [isValid, setIsValid] = useState<boolean>(false);

  const debouncedHexInput = useDebounce(validHexInput, 300);

  const isValidHexString = useCallback((val: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(val.trim());
  }, []);

  const handleHexInputChange = useCallback(
    (rawInput: string, _isManual?: boolean) => {
      const trimmed = rawInput.trim();
      const ok = isValidHexString(trimmed);

      debugLog.log(`🖊️ handleHexInputChange called with: ${trimmed}, isManual: ${_isManual}, isValid: ${ok}`);

      setIsValid(ok);
      if (ok) {
        setValidHexInput(trimmed);
        setFailedHexInput('');
        setFailedHexCount(0);
      } else {
        setFailedHexInput(trimmed);
        setFailedHexCount((prev) => prev + 1);
      }

      return ok;
    },
    [isValidHexString]
  );

  const resetHexInput = useCallback(() => {
    debugLog.log('♻️ resetHexInput called');
    setValidHexInput('');
    setFailedHexInput('');
    setFailedHexCount(0);
    setIsValid(false);
  }, []);

  const dumpFSMContext = (headerInfo?: string) => {
    console.log(`🛠️ [FSMContext Dump] ${headerInfo || ''}`, { inputState, validatedAsset });
  };

  const dumpInputFeedContext = (headerInfo?: string) => {
    console.log(`🛠️ [InputFeedContext Dump] ${headerInfo || ''}`, {
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
    });
  };

  const dumpSharedPanelContext = (headerInfo?: string) => {
    console.log(`🛠️ [SharedPanelContext Dump] ${headerInfo || ''}`);
    dumpFSMContext();
    dumpInputFeedContext();
  };

  // 🔧 Log debounced value
  debugLog.log(`⏳ debouncedHexInput: ${debouncedHexInput}`);

  return (
    <SharedPanelContext.Provider
      value={{
        inputState,
        setInputState,
        validatedAsset,
        setValidatedAsset,
        validHexInput,
        debouncedHexInput,
        failedHexInput,
        isValid,
        handleHexInputChange,
        resetHexInput,
        failedHexCount,
        isValidHexString,
        dumpFSMContext,
        dumpInputFeedContext,
        dumpSharedPanelContext,
        containerType: CONTAINER_TYPE.SELL_SELECT_CONTAINER,
        feedType: FEED_TYPE.TOKEN_LIST,
        forceReset: resetHexInput,
        forceClose: () => setInputState(InputState.CLOSE_SELECT_SCROLL_PANEL),
      }}
    >
      {children}
    </SharedPanelContext.Provider>
  );
};
