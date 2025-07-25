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
import { isTerminalFSMState } from '@/lib/hooks/inputValidations/FSM_Core/terminalStates';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const debugLog = createDebugLogger('SharedPanelProvider', DEBUG_ENABLED, LOG_TIME);

const DEBUG_ENABLED_FSM = process.env.NEXT_PUBLIC_DEBUG_LOG_INPUT_STATE_MANAGER === 'true';
const debugFSM = createDebugLogger('useInputStateManager', DEBUG_ENABLED_FSM, LOG_TIME);

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
  const [validatedAsset, setValidatedAssetRaw] = useState<TokenContract | undefined>(undefined);

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

  const setInputState = useCallback((next: InputState) => {
    setInputStateRaw((prev) => {
      if (prev === next) {
        debugFSM.log(`🚫 Skipping setInputState — already in ${getInputStateString(next)}`);
        return prev;
      }
      debugFSM.log(`📝 setInputState → ${getInputStateString(next)}`);
      return next;
    });
  }, []);

  const setValidatedAsset = useCallback((next: TokenContract | undefined) => {
    if (validatedAsset && next && validatedAsset.address === next.address) {
      debugFSM.log(`🚫 Skipping setValidatedAsset — already ${next.symbol || next.address}`);
      return;
    }
    debugFSM.log(next ? `✅ setValidatedAsset → ${next.symbol || next.address}` : '🧹 Clearing validated asset');
    setValidatedAssetRaw(next);
  }, [validatedAsset]);

  // 🔁 Unified FSM handler
useEffect(() => {
  switch (inputState) {
    case InputState.UPDATE_VALIDATED_ASSET:
      debugLog.log(`📺 [FSM Hook] Reached UPDATE_VALIDATED_ASSET`);
      if (validatedAsset) {
        debugFSM.log(`💰 UPDATE_VALIDATED_ASSET → setTradingTokenCallback with ${validatedAsset.symbol || validatedAsset.address}`);
        setTradingTokenCallback(validatedAsset);
        setInputState(InputState.CLOSE_SELECT_PANEL);
      } else {
        debugFSM.warn(`⚠️ UPDATE_VALIDATED_ASSET state but validatedAsset is missing`);
      }
      break;

    case InputState.CLOSE_SELECT_PANEL:
      debugLog.log(`📺 [FSM Hook] Reached CLOSE_SELECT_PANEL`);
      debugFSM.log(`🛑 CLOSE_SELECT_PANEL → closeCallback(true)`);
      closeCallback(true);
      break;

    default:
      // Do nothing for all other states
      break;
  }
}, [inputState, validatedAsset, setTradingTokenCallback, closeCallback, setInputState]);


  const dumpFSMContext = (headerInfo?: string) => {
    debugLog.log(`🛠️ [FSMContext Dump] ${headerInfo || ''}`, {
      inputState: getInputStateString(inputState),
      validatedAsset,
      instanceId,
    });
  };

  const dumpInputFeedContext = (headerInfo?: string) => {
    debugLog.log(`🛠️ [InputFeedContext Dump] ${headerInfo || ''}`, {
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      instanceId,
    });
  };

  const dumpSharedPanelContext = (headerInfo?: string) => {
    debugLog.log(`🛠️ [SharedPanelContext Dump] ${headerInfo || ''}`);
    dumpFSMContext();
    dumpInputFeedContext();
  };

  const contextValue = useMemo(() => ({
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
    forceReset: resetHexInput,
    instanceId,
    closeCallback: () => closeCallback(true),
    setTradingTokenCallback,
  }), [
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
    instanceId,
    closeCallback,
    setTradingTokenCallback,
  ]);

  return (
    <SharedPanelContext.Provider value={contextValue}>
      {children}
    </SharedPanelContext.Provider>
  );
};
