// File: lib/context/ScrollSelectPanels/SharedPanelProvider.tsx

'use client';

import React, { ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
import { SharedPanelContext } from './useSharedPanelContext';
import {
  SP_COIN_DISPLAY,
  FEED_TYPE,
  InputState,
  getInputStateString,
  TokenContract,
} from '@/lib/structure';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const debugLog = createDebugLogger('SharedPanelProvider', DEBUG_ENABLED, LOG_TIME);

interface SharedPanelProviderProps {
  children: ReactNode;
  closeCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: TokenContract) => void;
}

export const SharedPanelProvider = ({
  children,
  closeCallback,
  setTradingTokenCallback,
}: SharedPanelProviderProps) => {
  const [inputState, setInputStateRaw] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAssetRaw] = useState<any>(undefined);

  const instanceId = 'main';

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
      debugLog.log(next ? `✅ setValidatedAsset → ${next.symbol || next.address}` : '🧹 Clearing validated asset');
      setValidatedAssetRaw(next);
    },
    [validatedAsset]
  );

  // ✅ Automatically invoke setTradingTokenCallback only on CLOSE_SELECT_PANEL
  useEffect(() => {
    debugLog.log(`📺 useEffect triggered: inputState = ${getInputStateString(inputState)}, validatedAsset =`, validatedAsset);

    if (inputState === InputState.CLOSE_SELECT_PANEL) {
      if (validatedAsset) {
        debugLog.log(`🚀 Triggering setTradingTokenCallback with ${validatedAsset.symbol || validatedAsset.address}`);
        setTradingTokenCallback(validatedAsset as TokenContract);
      } else {
        debugLog.warn(`⚠️ inputState is CLOSE_SELECT_PANEL but validatedAsset is missing or undefined`);
      }
    }
  }, [validatedAsset, inputState, setTradingTokenCallback]);

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

  const forceReset = resetHexInput;
  const forceClose = () => {
    debugLog.log(`🧨 forceClose triggered → setting inputState to CLOSE_SELECT_PANEL`);
    setInputState(InputState.CLOSE_SELECT_PANEL);
  };

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
      closeCallback: () => closeCallback(true),
      setTradingTokenCallback,
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
      closeCallback,
      setTradingTokenCallback,
    ]
  );

  return <SharedPanelContext.Provider value={contextValue}>{children}</SharedPanelContext.Provider>;
};
