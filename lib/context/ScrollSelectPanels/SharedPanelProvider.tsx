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
import { useRestartFSMIfNeeded } from '@/lib/hooks/inputValidations/utils/useRestartFSM';
import { handleFSMTerminalState } from '@/lib/hooks/inputValidations/utils/handleTerminalState';
import { dumpFSMContext, dumpInputFeedContext } from '@/lib/hooks/inputValidations/utils/debugContextDump';

// ─── Debug Config ─────────────────────────────
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const DEBUG_ENABLED_FSM = process.env.NEXT_PUBLIC_DEBUG_LOG_INPUT_STATE_MANAGER === 'true';

const debugLog = createDebugLogger('SharedPanelProvider', DEBUG_ENABLED, LOG_TIME);
const debugFSM = createDebugLogger('useInputStateManager', DEBUG_ENABLED_FSM, LOG_TIME);

// ─── Constants ─────────────────────────────
const instanceId = 'main';
const containerType = SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL;
const feedType = FEED_TYPE.TOKEN_LIST;

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
        debugFSM.log(`⏭️ Skipped setInputState → Already in ${getInputStateString(next)}`);
        return prev;
      }
      debugFSM.log(`✳️ setInputState → ${getInputStateString(next)}`);
      return next;
    });
  }, []);

  const setValidatedAsset = useCallback((next: TokenContract | undefined) => {
    if (
      validatedAsset?.address === next?.address &&
      validatedAsset?.symbol === next?.symbol
    ) {
      debugFSM.log(`⏭️ Skipped setValidatedAsset → Already ${next?.symbol || next?.address}`);
      return;
    }
    debugFSM.log(next
      ? `✅ setValidatedAsset → ${next.symbol || next.address}`
      : '🧼 Cleared validated asset');
    setValidatedAssetRaw(next);
  }, [validatedAsset]);

  useRestartFSMIfNeeded(inputState, debouncedHexInput, setInputState);

  useEffect(() => {
    handleFSMTerminalState(inputState, validatedAsset, setInputState, setValidatedAsset, setTradingTokenCallback, closeCallback);
  }, [inputState, validatedAsset, setInputState, setValidatedAsset, setTradingTokenCallback, closeCallback]);

  const fsmContext = useMemo(() => ({
    inputState,
    setInputState,
    validatedAsset,
    setValidatedAsset,
    dumpFSMContext: (header?: string) =>
      dumpFSMContext(header ?? '', inputState, validatedAsset, instanceId),

    dumpSharedPanelContext: (header?: string) => {
      debugLog.log(`📆 SharedPanelContext Dump: ${header ?? ''}`);
      dumpFSMContext(header ?? '', inputState, validatedAsset, instanceId);
      dumpInputFeedContext(header ?? '', validHexInput, debouncedHexInput, failedHexInput, failedHexCount, isValid, instanceId);
    },

    containerType,
    feedType,
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
    dumpInputFeedContext: (header?: string) =>
      dumpInputFeedContext(header ?? '', validHexInput, debouncedHexInput, failedHexInput, failedHexCount, isValid, instanceId),
  }), [validHexInput, debouncedHexInput, failedHexInput, failedHexCount, isValid, isValidHexString, handleHexInputChange, resetHexInput]);

  return (
    <SharedPanelContext.Provider value={{ ...fsmContext, ...inputFeedContext }}>
      {children}
    </SharedPanelContext.Provider>
  );
};
