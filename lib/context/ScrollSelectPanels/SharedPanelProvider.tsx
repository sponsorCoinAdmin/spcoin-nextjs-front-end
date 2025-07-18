// File: lib/context/ScrollSelectPanels/SharedPanelProvider.tsx

'use client';

import React, { ReactNode, useState, useCallback, useEffect } from 'react';
import { SharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { CONTAINER_TYPE, FEED_TYPE, InputState } from '@/lib/structure';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// Setup debug logger
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const debugLog = createDebugLogger('SharedPanelProvider', DEBUG_ENABLED, LOG_TIME);

export const SharedPanelProvider = ({ children }: { children: ReactNode }) => {
  // FSM state
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAsset] = useState<any>(undefined);

  // Input state
  const [validHexInput, setValidHexInput] = useState<string>('');
  const [failedHexInput, setFailedHexInput] = useState<string>('');
  const [failedHexCount, setFailedHexCount] = useState<number>(0);
  const [isValid, setIsValid] = useState<boolean>(false);

  // Debounced value
  const debouncedHexInput = useDebounce(validHexInput, 300);

  // 🔥 Generate unique instance ID here (static or random if needed)
  const instanceId = 'main'; // You can swap with uuid() or nanoid() if needed

  // Validation helper
  const isValidHexString = useCallback((val: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(val.trim());
  }, []);

  // Input change handler
  const handleHexInputChange = useCallback(
    (rawInput: string, isManual?: boolean) => {
      const trimmed = rawInput.trim();
      const ok = isValidHexString(trimmed);

      debugLog.log(`🖊️ handleHexInputChange → value="${trimmed}" | isManual=${isManual} | isValid=${ok}`);

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

  // Reset handler
  const resetHexInput = useCallback(() => {
    debugLog.log('♻️ resetHexInput called');
    setValidHexInput('');
    setFailedHexInput('');
    setFailedHexCount(0);
    setIsValid(false);
  }, []);

  // 🔍 Log every debouncedHexInput change (triggers AFTER debounce)
  useEffect(() => {
    debugLog.log(`🔄 debouncedHexInput updated → "${debouncedHexInput}"`);
  }, [debouncedHexInput]);

  // Dump helpers
  const dumpFSMContext = (headerInfo?: string) => {
    console.log(`🛠️ [FSMContext Dump] ${headerInfo || ''}`, {
      inputState,
      validatedAsset,
      instanceId,
    });
  };

  const dumpInputFeedContext = (headerInfo?: string) => {
    console.log(`🛠️ [InputFeedContext Dump] ${headerInfo || ''}`, {
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      instanceId,
    });
  };

  const dumpSharedPanelContext = (headerInfo?: string) => {
    console.log(`🛠️ [SharedPanelContext Dump] ${headerInfo || ''}`);
    dumpFSMContext();
    dumpInputFeedContext();
  };

  debugLog.log(`🚀 SharedPanelProvider mounted with instanceId="${instanceId}"`);

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
        instanceId, // ✅ explicitly provided downstream
      }}
    >
      {children}
    </SharedPanelContext.Provider>
  );
};
