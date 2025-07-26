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
        debugFSM.log(`\u274C Skipping setInputState — already in ${getInputStateString(next)}`);
        return prev;
      }
      debugFSM.log(`\u270D\ufe0f setInputState → ${getInputStateString(next)}`);
      return next;
    });
  }, []);

  const setValidatedAsset = useCallback((next: TokenContract | undefined) => {
    if (validatedAsset && next && validatedAsset.address === next.address) {
      debugFSM.log(`\u274C Skipping setValidatedAsset — already ${next.symbol || next.address}`);
      return;
    }
    debugFSM.log(next ? `\u2705 setValidatedAsset → ${next.symbol || next.address}` : '\ud83d\udec9 Clearing validated asset');
    setValidatedAssetRaw(next);
  }, [validatedAsset]);

  useEffect(() => {
    switch (inputState) {
      case InputState.UPDATE_VALIDATED_ASSET:
        debugLog.log(`\ud83d\udcca [FSM Hook] Reached UPDATE_VALIDATED_ASSET`);
        if (validatedAsset) {
          debugFSM.log(`\ud83d\udcb0 UPDATE_VALIDATED_ASSET → setTradingTokenCallback with ${validatedAsset.symbol || validatedAsset.address}`);
          setTradingTokenCallback(validatedAsset);
          setInputState(InputState.CLOSE_SELECT_PANEL);
        } else {
          debugFSM.warn(`\u26a0\ufe0f UPDATE_VALIDATED_ASSET state but validatedAsset is missing`);
        }
        break;

      case InputState.CLOSE_SELECT_PANEL:
        debugLog.log(`\ud83d\udcca [FSM Hook] Reached CLOSE_SELECT_PANEL`);
        debugFSM.log(`\ud83d\uded1 CLOSE_SELECT_PANEL → closeCallback(true)`);
        closeCallback(true);
        break;
    }
  }, [inputState, validatedAsset, setTradingTokenCallback, closeCallback, setInputState]);

  const dumpFSMContext = (headerInfo?: string) => {
    debugLog.log(`\ud83d\udee0\ufe0f [FSMContext Dump] ${headerInfo || ''}`, {
      inputState: getInputStateString(inputState),
      validatedAsset,
      instanceId,
    });
  };

  const dumpInputFeedContext = (headerInfo?: string) => {
    debugLog.log(`\ud83d\udee0\ufe0f [InputFeedContext Dump] ${headerInfo || ''}`, {
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      instanceId,
    });
  };

  const dumpSharedPanelContext = (headerInfo?: string) => {
    debugLog.log(`\ud83d\udee0\ufe0f [SharedPanelContext Dump] ${headerInfo || ''}`);
    dumpFSMContext();
    dumpInputFeedContext();
  };

  const fsmContext = useMemo(() => ({
    inputState,
    setInputState,
    validatedAsset,
    setValidatedAsset,
    dumpFSMContext,
    dumpSharedPanelContext,
    containerType: SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL,
    feedType: FEED_TYPE.TOKEN_LIST,
    closeCallback: () => closeCallback(true),
    setTradingTokenCallback,
    instanceId,
  }), [inputState, validatedAsset, setInputState, setValidatedAsset, closeCallback, setTradingTokenCallback]);

  const inputFeedContext = useMemo(() => ({
    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange,
    resetHexInput,
    forceReset: resetHexInput,
    dumpInputFeedContext,
  }), [
    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange,
    resetHexInput,
  ]);

  const contextValue = useMemo(() => ({
    ...fsmContext,
    ...inputFeedContext,
  }), [fsmContext, inputFeedContext]);

  return (
    <SharedPanelContext.Provider value={contextValue}>
      {children}
    </SharedPanelContext.Provider>
  );
};
