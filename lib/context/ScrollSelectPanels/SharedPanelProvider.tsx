// File: lib/context/ScrollSelectPanels/SharedPanelProvider.tsx
'use client';

import React, {
  ReactNode,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
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

import { useFSMStateManager } from '@/lib/hooks/inputValidations/FSM_Core/useFSMStateManager';
import {
  SharedPanelBag,
  isTokenSelectBag,
} from '@/lib/context/ScrollSelectPanels/structure/types/panelBag';

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

  /** Optional, typed payload for the active panel */
  initialPanelBag?: SharedPanelBag;
}

export const SharedPanelProvider = ({
  children,
  closePanelCallback,
  setTradingTokenCallback,
  containerType,
  initialPanelBag,
}: SharedPanelProviderProps) => {
  // Widen so FSM tests can receive either account or token without casting.
  const [validatedAsset, setValidatedAssetRaw] =
    useState<WalletAccount | TokenContract | undefined>(undefined);

  // --- manualEntry with ref to avoid batching/race issues ---
  const [manualEntryState, setManualEntryState] = useState<boolean>(false);
  const manualEntryRef = useRef<boolean>(manualEntryState);
  useEffect(() => {
    manualEntryRef.current = manualEntryState;
    // 🔔 TRACE: alert whenever the STATE actually changes
    // alert(`[SharedPanelProvider] manualEntry STATE → ${String(manualEntryState)}`);
  }, [manualEntryState]);

  // Expose a traced setter (alerts/logs when toggled)
  const setManualEntry = useCallback((next: boolean) => {
    // alert(`[SharedPanelProvider] setManualEntry(${String(next)})`);
    debugLog.log(`✍️ setManualEntry(${String(next)})`);
    setManualEntryState(next);
  }, []);

  // Dynamic, typed panel bag (defaults to current containerType with no payload)
  const [panelBag, setPanelBag] = useState<SharedPanelBag>(
    initialPanelBag ?? ({ type: containerType } as SharedPanelBag)
  );

  const setValidatedAsset = useCallback(
    (next: WalletAccount | TokenContract | undefined) => {
      // If both are TokenContract-like, compare address/symbol; otherwise just set
      const sameToken =
        (validatedAsset as TokenContract | undefined)?.address ===
          (next as TokenContract | undefined)?.address &&
        (validatedAsset as TokenContract | undefined)?.symbol ===
          (next as TokenContract | undefined)?.symbol;

      if (sameToken) {
        debugFSM.log(
          `⏭️ Skipped setValidatedAsset → Already ${
            (next as TokenContract | undefined)?.symbol ||
            (next as TokenContract | undefined)?.address
          }`
        );
        return;
      }

      debugFSM.log(
        next
          ? `✅ setValidatedAsset → ${
              (next as any)?.symbol || (next as any)?.address || 'asset'
            }`
          : '🧼 Cleared validated asset'
      );
      setValidatedAssetRaw(next);
    },
    [validatedAsset]
  );

  // If this is a token-select panel, extract the peer address from the bag
  const peerAddress = isTokenSelectBag(panelBag) ? panelBag.peerAddress : undefined;

  // 🔔 TRACE: show what we are about to pass into the FSM hook whenever snapshot/peer changes
  useEffect(() => {
    // alert(
    //   `[SharedPanelProvider] (pre-FSM hook) snapshot → manualEntry=${String(
    //     manualEntryRef.current
    //   )}, peerAddress=${peerAddress ?? 'none'}`
    // );
  }, [manualEntryState, peerAddress]);

  // useFSMStateManager owns the input feed + runs FSM (terminal side-effects inside FSM tests)
  // IMPORTANT: pass the fresh snapshot from manualEntryRef to avoid races
  const {
    inputState,
    setInputState,

    // input feed (sourced from the hook)
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
    // side-effects
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
    // used by validateDuplicate
    peerAddress,
    // manual vs datalist select (fresh snapshot)
    manualEntry: manualEntryRef.current,
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
      dumpFSMContext(
        header ?? '',
        inputState,
        validatedAsset as TokenContract | undefined,
        instanceId
      );
      dumpInputFeed(header ?? '');
      debugLog.log(`ℹ️ manualEntry (snapshot) = ${String(manualEntryRef.current)}`);
    },
    [inputState, validatedAsset, dumpInputFeed]
  );

  const contextValue = useMemo(
    () => ({
      inputState,
      setInputState,
      validatedAsset,
      setValidatedAsset,

      // expose state + setter for UI components
      manualEntry: manualEntryState,
      setManualEntry,

      setValidatedToken,
      setValidatedWallet,

      dumpFSMContext: (header?: string) =>
        dumpFSMContext(
          header ?? '',
          inputState,
          validatedAsset as TokenContract | undefined,
          instanceId
        ),
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

      // expose dynamic, typed panel bag
      panelBag,
      setPanelBag,
    }),
    [
      inputState,
      setInputState,
      validatedAsset,
      manualEntryState,
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
      panelBag,
      setPanelBag,
    ]
  );

  return (
    <SharedPanelContext.Provider value={contextValue}>
      {children}
    </SharedPanelContext.Provider>
  );
};
