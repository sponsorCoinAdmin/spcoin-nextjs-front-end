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
  WalletAccount,
} from '@/lib/structure';

import { useHexInput } from '@/lib/hooks/useHexInput';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { handleFSMTerminalState } from '@/lib/hooks/inputValidations/utils/handleTerminalState';
import {
  dumpFSMContext,
  dumpInputFeedContext,
} from '@/lib/hooks/inputValidations/utils/debugContextDump';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const DEBUG_ENABLED_FSM = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';

const debugLog = createDebugLogger('SharedPanelProvider', DEBUG_ENABLED, LOG_TIME);
const debugFSM = createDebugLogger('useInputStateManager', DEBUG_ENABLED_FSM, LOG_TIME);

// Default context-wide constants (can become props later)
const instanceId = 'main';
const feedType = FEED_TYPE.TOKEN_LIST;

interface SharedPanelProviderProps {
  children: ReactNode;
  closeCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: TokenContract) => void;
  containerType: SP_COIN_DISPLAY;
}

export const SharedPanelProvider = ({
  children,
  closeCallback,
  setTradingTokenCallback,
  containerType,
}: SharedPanelProviderProps) => {
  // FSM state
  const [inputState, setInputStateRaw] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAssetRaw] = useState<TokenContract | undefined>(undefined);
  const [manualEntry, setManualEntry] = useState<boolean>(true);
  const prevInputState = useRef<InputState>(InputState.EMPTY_INPUT);

  // Input feed state
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

  // FSM effect: auto-mark invalid input
  useEffect(() => {
    if (failedHexCount > 0) {
      setInputState(InputState.INVALID_HEX_INPUT);
    }
  }, [failedHexCount]);

  // FSM: set state with logging and guard
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

  // FSM: set validated asset
  const setValidatedAsset = useCallback((next: TokenContract | undefined) => {
    if (
      validatedAsset?.address === next?.address &&
      validatedAsset?.symbol === next?.symbol
    ) {
      debugFSM.log(`⏭️ Skipped setValidatedAsset → Already ${next?.symbol || next?.address}`);
      return;
    }
    debugFSM.log(
      next
        ? `✅ setValidatedAsset → ${next.symbol || next.address}`
        : '🧼 Cleared validated asset'
    );
    setValidatedAssetRaw(next);
  }, [validatedAsset]);

  // FSM: handle terminal states like close or update
  useEffect(() => {
    handleFSMTerminalState(
      inputState,
      validatedAsset,
      setInputState,
      setValidatedAsset,
      setTradingTokenCallback,
      closeCallback
    );
    prevInputState.current = inputState;
  }, [
    inputState,
    validatedAsset,
    setInputState,
    setValidatedAsset,
    setTradingTokenCallback,
    closeCallback,
  ]);

  // Callbacks for token and wallet
  const setValidatedToken = useCallback((token?: TokenContract) => {
    debugFSM.log(`🪙 setValidatedToken called`);
    setValidatedAsset(token);
  }, [setValidatedAsset]);

  const setValidatedWallet = useCallback((_wallet?: WalletAccount) => {
    debugFSM.warn(`⚠️ setValidatedWallet called in token panel → ignored`);
  }, []);

  // Dump utilities
  const dumpInputFeed = useCallback((header?: string) => {
    dumpInputFeedContext(
      header ?? '',
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      instanceId
    );
  }, [validHexInput, debouncedHexInput, failedHexInput, failedHexCount, isValid]);

  const dumpSharedPanel = useCallback((header?: string) => {
    debugLog.log(`📆 SharedPanelContext Dump: ${header ?? ''}`);
    dumpFSMContext(header ?? '', inputState, validatedAsset, instanceId);
    dumpInputFeed(header ?? '');
  }, [inputState, validatedAsset, dumpInputFeed]);

  // Final context object
  const contextValue = useMemo(() => ({
    // FSM State
    inputState,
    setInputState,
    validatedAsset,
    setValidatedAsset,
    manualEntry,
    setManualEntry,
    setValidatedToken,
    setValidatedWallet,

    // Dump
    dumpFSMContext: (header?: string) =>
      dumpFSMContext(header ?? '', inputState, validatedAsset, instanceId), dumpSharedPanelContext: dumpSharedPanel,

    // Input feed
    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange,
    resetHexInput,
    dumpInputFeedContext: dumpInputFeed,

    // Identity
    containerType,
    feedType,
    closeCallback: () => closeCallback(true),
    setTradingTokenCallback,
    instanceId,
  }), [
    inputState,
    validatedAsset,
    manualEntry,
    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange,
    resetHexInput,
    containerType,
    feedType,
    closeCallback,
    setTradingTokenCallback,
    dumpInputFeed,
    dumpSharedPanel,
  ]);

  return (
    <SharedPanelContext.Provider value={contextValue}>
      {children}
    </SharedPanelContext.Provider>
  );
};
