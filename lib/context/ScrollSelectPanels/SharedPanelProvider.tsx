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
import { isValidFSMTransition } from '@/lib/hooks/inputValidations/FSM_Core/utils/transitionGuards'; // ✅ NEW

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const DEBUG_ENABLED_FSM = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';

const debugLog = createDebugLogger('SharedPanelProvider', DEBUG_ENABLED, LOG_TIME);
const debugFSM = createDebugLogger('useInputStateManager', DEBUG_ENABLED_FSM, LOG_TIME);

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
  const [inputState, setInputStateRaw] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAssetRaw] = useState<TokenContract | undefined>(undefined);
  const [manualEntry, setManualEntry] = useState<boolean>(true);
  const prevInputState = useRef<InputState>(InputState.EMPTY_INPUT);

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

  // ✅ Guarded transition logic
  const setInputState = useCallback(
    (next: InputState, source = 'SharedPanelProvider') => {
      setInputStateRaw((prev) => {
        // ALERTS(`📣 Source [${source}]: Attempting transition from ${getInputStateString(prev)} → ${getInputStateString(next)}`);

        if (prev === next) {
          // ALERTS(`⏭️ Source [${source}]: Skipped setInputState → Already in ${getInputStateString(next)}`);
          debugFSM.log(`⏭️ Source [${source}]: Skipped setInputState → Already in ${getInputStateString(next)}`);
          return prev;
        }

        if (!isValidFSMTransition(prev, next)) {
          // ALERTS(`🚫 Source [${source}]: Invalid FSM transition: ${getInputStateString(prev)} → ${getInputStateString(next)} (source: ${source})`);
          debugFSM.warn(`🚫 Source [${source}]: Invalid FSM transition: ${getInputStateString(prev)} → ${getInputStateString(next)} (source: ${source})`);
          return prev;
        }

        debugFSM.log(`✳️ Source [${source}]: setInputState → ${getInputStateString(next)}`);
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (failedHexCount > 0) {
      setInputState(InputState.INVALID_HEX_INPUT, 'FSM effect: failedHexCount');
    }
  }, [failedHexCount, setInputState]);

  const setValidatedAsset = useCallback(
    (next: TokenContract | undefined) => {
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
    },
    [validatedAsset]
  );

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

  const setValidatedToken = useCallback(
    (token?: TokenContract) => {
      debugFSM.log(`🪙 setValidatedToken called`);
      setValidatedAsset(token);
    },
    [setValidatedAsset]
  );

  const setValidatedWallet = useCallback((_wallet?: WalletAccount) => {
    debugFSM.warn(`⚠️ setValidatedWallet called in token panel → ignored`);
  }, []);

  const dumpInputFeed = useCallback(
    (header?: string) => {
      dumpInputFeedContext(
        header ?? '',
        validHexInput,
        debouncedHexInput,
        failedHexInput,
        failedHexCount,
        isValid,
        instanceId
      );
    },
    [validHexInput, debouncedHexInput, failedHexInput, failedHexCount, isValid]
  );

  const dumpSharedPanel = useCallback(
    (header?: string) => {
      debugLog.log(`📆 SharedPanelContext Dump: ${header ?? ''}`);
      dumpFSMContext(header ?? '', inputState, validatedAsset, instanceId);
      dumpInputFeed(header ?? '');
    },
    [inputState, validatedAsset, dumpInputFeed]
  );

  const contextValue = useMemo(
    () => ({
      inputState,
      setInputState,
      validatedAsset,
      setValidatedAsset,
      manualEntry,
      setManualEntry,
      setValidatedToken,
      setValidatedWallet,

      dumpFSMContext: (header?: string) =>
        dumpFSMContext(header ?? '', inputState, validatedAsset, instanceId),
      dumpSharedPanelContext: dumpSharedPanel,

      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChange,
      resetHexInput,
      dumpInputFeedContext: dumpInputFeed,

      containerType,
      feedType,
      closeCallback: () => closeCallback(true),
      setTradingTokenCallback,
      instanceId,
    }),
    [
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
    ]
  );

  return (
    <SharedPanelContext.Provider value={contextValue}>
      {children}
    </SharedPanelContext.Provider>
  );
};
