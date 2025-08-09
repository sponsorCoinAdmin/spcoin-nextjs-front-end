// File: lib/context/ScrollSelectPanels/SharedPanelProvider.tsx
'use client';

import React, {
  ReactNode,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { SharedPanelContext } from './useSharedPanelContext';
import {
  SP_COIN_DISPLAY,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import {
  dumpFSMContext,
  dumpInputFeedContext,
} from '@/lib/hooks/inputValidations/utils/debugContextDump';

// ✅ FIX: import from helpers barrel (make sure you have helpers/index.ts exporting the hook)
import { useFSMStateManager } from '@/lib/hooks/inputValidations/FSM_Core/useFSMStateManager';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const DEBUG_ENABLED_FSM = process.env.NEXT_PUBLIC_FSM === 'true';

const debugLog = createDebugLogger('SharedPanelProvider', DEBUG_ENABLED, LOG_TIME);
const debugFSM = createDebugLogger('useInputStateManager', DEBUG_ENABLED_FSM, LOG_TIME);

const instanceId = 'main';
const feedType = FEED_TYPE.TOKEN_LIST;

interface SharedPanelProviderProps {
  children: ReactNode;
  closePanelCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: TokenContract) => void;
  containerType: SP_COIN_DISPLAY;
}

export const SharedPanelProvider = ({
  children,
  closePanelCallback,
  setTradingTokenCallback,
  containerType,
}: SharedPanelProviderProps) => {
  const [validatedAsset, setValidatedAssetRaw] = useState<TokenContract | undefined>(undefined);
  const [manualEntry, setManualEntry] = useState<boolean>(true);

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

  // 🔹 useFSMStateManager now owns useHexInput + runs FSM + handles terminal states
  const {
    inputState,
    setInputState,

    // input feed (sourced from the hook, not from the provider anymore)
    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange,
    resetHexInput,
  } = useFSMStateManager({
    containerType,
    feedType,
    instanceId,
    validatedAsset,          // ✅ pass current asset so hook can handle terminal states
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
  });

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

      // input feed (exposed from the FSM hook)
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
      closePanelCallback: () => closePanelCallback(true),
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
      closePanelCallback,
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
