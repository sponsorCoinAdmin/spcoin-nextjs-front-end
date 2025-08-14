// File: lib/context/ScrollSelectPanels/AssetSelectionProvider.tsx
'use client';

import React, {
  ReactNode,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';

import { AssetSelectionContext } from './useAssetSelectionContext';
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
  AssetSelectionBag,
  isTokenSelectBag,
} from '@/lib/context/ScrollSelectPanels/structure/types/panelBag';

// ⬇️ NEW: pull sub-display actions so consumers can access them via this context, too
import {
  useAssetSelectionDisplay,
} from '@/lib/context/AssetSelection/AssetSelectionDisplayProvider';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const DEBUG_ENABLED_FSM = process.env.NEXT_PUBLIC_FSM === 'true';

const debugLog = createDebugLogger('AssetSelectionProvider', DEBUG_ENABLED, LOG_TIME);
const debugFSM = createDebugLogger('useFSMStateManager', DEBUG_ENABLED_FSM, LOG_TIME);

const instanceId = 'main';
const feedType = FEED_TYPE.TOKEN_LIST;

interface AssetSelectionProviderProps {
  children: ReactNode;
  closePanelCallback: (fromUser: boolean) => void;
  /** Widen to allow either token or wallet if a future panel uses wallets */
  setTradingTokenCallback: (asset: TokenContract | WalletAccount) => void;
  containerType: SP_COIN_DISPLAY;

  /** Optional, typed payload for the active panel */
  initialPanelBag?: AssetSelectionBag;
}

export const AssetSelectionProvider = ({
  children,
  closePanelCallback,
  setTradingTokenCallback,
  containerType,
  initialPanelBag,
}: AssetSelectionProviderProps) => {
  // Widen so FSM tests can receive either account or token without casting.
  const [validatedAsset, setValidatedAssetRaw] =
    useState<WalletAccount | TokenContract | undefined>(undefined);

  // --- manualEntry with ref to avoid batching/race issues ---
  const [manualEntryState, setManualEntryState] = useState<boolean>(false);
  const manualEntryRef = useRef<boolean>(manualEntryState);
  useEffect(() => {
    manualEntryRef.current = manualEntryState;
  }, [manualEntryState]);

  // Expose a traced setter
  const setManualEntry = useCallback((next: boolean) => {
    debugLog.log(`✍️ setManualEntry(${String(next)})`);
    setManualEntryState(next);
  }, []);

  // Dynamic, typed panel bag (defaults to current containerType with no payload)
  const [panelBag, setPanelBag] = useState<AssetSelectionBag>(
    initialPanelBag ?? ({ type: containerType } as AssetSelectionBag)
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

  const dumpAssetSelection = useCallback(
    (header?: string) => {
      debugLog.log(`📆 AssetSelectionContext Dump: ${header ?? ''}`);
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

  // ⬇️ NEW: convenience actions to manage nested preview visibility
  const {
    showErrorPreview,
    showAssetPreview,
    resetPreview,
  } = useAssetSelectionDisplay();

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
      dumpAssetSelectionContext: dumpAssetSelection,

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

      // ⬇️ NEW: pass-through preview controls (wrapping setActiveSubDisplay)
      showErrorPreview,
      showAssetPreview,
      resetPreview,
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
      dumpAssetSelection,
      panelBag,
      setPanelBag,
      showErrorPreview,
      showAssetPreview,
      resetPreview,
    ]
  );

  return (
    <AssetSelectionContext.Provider value={contextValue}>
      {children}
    </AssetSelectionContext.Provider>
  );
};

export default AssetSelectionProvider;
