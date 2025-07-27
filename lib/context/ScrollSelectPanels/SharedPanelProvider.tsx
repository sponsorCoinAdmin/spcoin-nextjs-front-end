// File: lib/context/ScrollSelectPanels/SharedPanelProvider.tsx

'use client';

import React, {
  ReactNode,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';

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

  const prevDebouncedRef = useRef('');
  const inputStateRef = useRef(inputState);
  inputStateRef.current = inputState;

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

  useEffect(() => {
    const handleFSMTerminalState = () => {
      switch (inputState) {
        case InputState.UPDATE_VALIDATED_ASSET:
          debugFSM.log('📥 FSM: UPDATE_VALIDATED_ASSET reached');
          if (validatedAsset) {
            debugFSM.log(`📦 setTradingTokenCallback → ${validatedAsset.symbol || validatedAsset.address}`);
            setTradingTokenCallback(validatedAsset);
            setInputState(InputState.CLOSE_SELECT_PANEL);
          } else {
            debugFSM.warn('⚠️ Missing validatedAsset in UPDATE_VALIDATED_ASSET');
          }
          break;

        case InputState.CLOSE_SELECT_PANEL:
          debugFSM.log('🚪 FSM: CLOSE_SELECT_PANEL → closeCallback(true)');
          closeCallback(true);
          break;
      }
    };

    handleFSMTerminalState();
  }, [inputState, validatedAsset, setTradingTokenCallback, closeCallback, setInputState]);

  // ──────────────────────────────────────────────
  // 🔁 Restart FSM if input changed from terminal
  // ──────────────────────────────────────────────
  useEffect(() => {
    const inputChanged = debouncedHexInput !== prevDebouncedRef.current;
    const isTerminal = isTerminalFSMState(inputStateRef.current);

    debugFSM.log('🔎 Debounce Watcher', {
      prevDebounced: prevDebouncedRef.current,
      currentDebounced: debouncedHexInput,
      inputChanged,
      state: getInputStateString(inputStateRef.current),
      isTerminal,
    });

    if (inputChanged && isTerminal) {
      debugFSM.log('🔁 [RESTART FSM FROM TERMINAL] → VALIDATE_ADDRESS');
      setInputState(InputState.VALIDATE_ADDRESS);
      prevDebouncedRef.current = debouncedHexInput;
    }
  }, [debouncedHexInput]);

  const dumpFSMContext = (headerInfo?: string) => {
    debugLog.log(`🧭 FSMContext Dump: ${headerInfo || ''}`, {
      inputState: getInputStateString(inputState),
      validatedAsset,
      instanceId,
    });
  };

  const dumpInputFeedContext = (headerInfo?: string) => {
    debugLog.log(`📡 InputFeedContext Dump: ${headerInfo || ''}`, {
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      instanceId,
    });
  };

  const dumpSharedPanelContext = (headerInfo?: string) => {
    debugLog.log(`📦 SharedPanelContext Dump: ${headerInfo || ''}`);
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
