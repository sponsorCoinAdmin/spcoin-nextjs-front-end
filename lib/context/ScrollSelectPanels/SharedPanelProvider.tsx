// File: lib/context/ScrollSelectPanels/SharedPanelProvider.tsx
'use client';

import React, {
  ReactNode,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

import { SharedPanelContext } from './useSharedPanelContext';
import {
  SP_COIN_DISPLAY,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
  InputState,
} from '@/lib/structure';

import { useHexInput } from '@/lib/hooks/useHexInput';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { handleFSMTerminalState } from '@/lib/hooks/inputValidations/utils/handleTerminalState';
import {
  dumpFSMContext,
  dumpInputFeedContext,
} from '@/lib/hooks/inputValidations/utils/debugContextDump';

import { useInputState } from '@/lib/hooks/inputValidations/helpers/useInputState';

import { useChainId, usePublicClient, useAccount } from 'wagmi';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const DEBUG_ENABLED_FSM = process.env.NEXT_PUBLIC_FSM === 'true';

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
  const [validatedAsset, setValidatedAssetRaw] = useState<TokenContract | undefined>(undefined);
  const [manualEntry, setManualEntry] = useState<boolean>(true);

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

  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: accountAddress } = useAccount();

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

  const {
    inputState,
    setInputState,
  } = useInputState({
    validHexInput,
    debouncedHexInput,
    containerType,
    feedType,
    instanceId,
    setValidatedAsset,
    closeCallback,
    setTradingTokenCallback,
  });

  useEffect(() => {
    handleFSMTerminalState(
      inputState,
      validatedAsset,
      setInputState,
      setValidatedAsset,
      setTradingTokenCallback,
      closeCallback
    );
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
      setInputState,
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
