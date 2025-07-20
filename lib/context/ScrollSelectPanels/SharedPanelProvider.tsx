'use client';

import React, { ReactNode, useState, useCallback, useMemo } from 'react';
import { SharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { SP_COIN_DISPLAY, FEED_TYPE, InputState, getInputStateString } from '@/lib/structure';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// Setup debug logger
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const debugLog = createDebugLogger('SharedPanelProvider', DEBUG_ENABLED, LOG_TIME);

export const SharedPanelProvider = ({ children }: { children: ReactNode }) => {
  // FSM state
  const [inputState, setInputStateRaw] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAssetRaw] = useState<any>(undefined);

  // 🔥 Unique ID (you can replace 'main' with nanoid() if needed)
  const instanceId = 'main';

  // Input state from useHexInput hook
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

  const setInputState = useCallback(
    (next: InputState) => {
      if (next === inputState) {
        debugLog.log(`🚫 Skipping setInputState — already in ${getInputStateString(next)}`);
        return;
      }
      debugLog.log(`📝 setInputState → ${getInputStateString(next)}`);
      setInputStateRaw(next);
    },
    [inputState]
  );

  const setValidatedAsset = useCallback(
    (next: any) => {
      if (validatedAsset && next && validatedAsset.address === next.address) {
        debugLog.log(`🚫 Skipping setValidatedAsset — already ${next.symbol || next.address}`);
        return;
      }
      debugLog.log(
        next ? `✅ setValidatedAsset → ${next.symbol || next.address}` : '🧹 Clearing validated asset'
      );
      setValidatedAssetRaw(next);
    },
    [validatedAsset]
  );

  const dumpFSMContext = (headerInfo?: string) => {
    console.log(`🛠️ [FSMContext Dump] ${headerInfo || ''}`, {
      inputState: getInputStateString(inputState),
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

  debugLog.log(`⏳ debouncedHexInput = "${debouncedHexInput}"`);

  const forceReset = resetHexInput;
  const forceClose = () => setInputState(InputState.CLOSE_SELECT_SCROLL_PANEL);

  const contextValue = useMemo(
    () => ({
      inputState,
      setInputState,
      validatedAsset,
      setValidatedAsset,
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChange,
      resetHexInput,
      dumpFSMContext,
      dumpInputFeedContext,
      dumpSharedPanelContext,
      containerType: SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL,
      feedType: FEED_TYPE.TOKEN_LIST,
      forceReset,
      forceClose,
      instanceId,
    }),
    [
      inputState,
      validatedAsset,
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
      instanceId,
    ]
  );

  return (
    <SharedPanelContext.Provider value={contextValue}>
      {children}
    </SharedPanelContext.Provider>
  );
};
