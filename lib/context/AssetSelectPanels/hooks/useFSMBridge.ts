// File: @/lib/context/AssetSelectPanels/hooks/useFSMBridge.ts
'use client';

import { useCallback, useEffect, useRef } from 'react';

import type {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  TokenContract,
  spCoinAccount,
} from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';
import { useFSMStateManager } from '@/lib/hooks/inputValidations/FSM_Core/useFSMStateManager';
import {
  dumpFSMContext,
  dumpInputFeedContext,
} from '@/lib/hooks/inputValidations/utils/debugContextDump';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { usePeerTokenAddress } from '@/lib/context/hooks/nestedHooks/useTokenContracts';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_FSM === 'true';

const debugLog = createDebugLogger('useFSMBridge', DEBUG_ENABLED, LOG_TIME);

type BridgeParams = {
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  instanceId: string;

  /** Live manualEntry value from parent */
  manualEntry: boolean;

  validatedAsset?: TokenContract | spCoinAccount;
  setValidatedAsset: (next?: TokenContract | spCoinAccount) => void;

  fireClosePanel: (fromUser: boolean) => void;
  fireSetTradingToken: (asset: TokenContract | spCoinAccount) => void;

  // UI preview funcs
  resetPreview: () => void;
  showAssetPreview: () => void;
  showErrorPreview: () => void;

  // per-instance bypass
  bypassFSM?: boolean;
};

export function useFSMBridge(params: BridgeParams) {
  const {
    containerType,
    feedType,
    instanceId,
    manualEntry,
    validatedAsset,
    setValidatedAsset,
    fireClosePanel,
    fireSetTradingToken,
    resetPreview,
    showAssetPreview,
    showErrorPreview,
    bypassFSM = false,
  } = params;

  // 🔁 Derive peer token address inside the bridge from live trade state
  const peerAddress = usePeerTokenAddress(containerType) ?? undefined;

  const {
    inputState,
    setInputState,
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
    peerAddress,
    manualEntry,
    setValidatedAsset,
    closePanelCallback: fireClosePanel,
    setTradingTokenCallback: fireSetTradingToken,
    bypassFSM,
  });

  // Terminal transition guard (StrictMode-friendly)
  const didHandleTerminalRef = useRef(false);

  // Handle terminal states — muted while bypassing
  useEffect(() => {
    if (bypassFSM) {
      didHandleTerminalRef.current = false;
      return;
    }

    if (inputState === InputState.RETURN_VALIDATED_ASSET) {
      if (didHandleTerminalRef.current) return;
      didHandleTerminalRef.current = true;

      if (!validatedAsset) {
        debugLog.warn?.(
          `[${instanceId}] RETURN_VALIDATED_ASSET with no validatedAsset`,
        );
      } else {
        debugLog.log?.(
          `[${instanceId}] ✅ commit validatedAsset → setTradingToken`,
          { manualEntryAtCommitStep: manualEntry },
        );
        fireSetTradingToken(validatedAsset);
      }

      setInputState(
        InputState.CLOSE_SELECT_PANEL,
        `Bridge(${instanceId}) commit → close`,
      );
      return;
    }

    if (inputState === InputState.CLOSE_SELECT_PANEL) {
      if (!didHandleTerminalRef.current) {
        debugLog.warn?.(
          `[${instanceId}] CLOSE_SELECT_PANEL before commit (asset=${String(
            !!validatedAsset,
          )})`,
        );
      }
      try {
        fireClosePanel(true);
      } finally {
        debugLog.log?.(`[${instanceId}] ♻️ reset after close`);
        resetPreview();
        setValidatedAsset(undefined);
        resetHexInput();
        didHandleTerminalRef.current = false;
        setInputState(
          InputState.EMPTY_INPUT,
          `Bridge(${instanceId}) closed`,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputState, validatedAsset, bypassFSM, manualEntry]);

  // UI preview bridge — muted while bypassing
  useEffect(() => {
    if (bypassFSM) return;

    switch (inputState) {
      case InputState.EMPTY_INPUT:
        resetPreview();
        break;

      case InputState.RESOLVE_ERC20_ASSET:
      case InputState.VALIDATE_PREVIEW:
        if (validatedAsset) showAssetPreview();
        break;

      case InputState.VALIDATE_ERC20_ASSET_ERROR:
      case InputState.VALIDATE_ERC20_ASSET_ERROR:
      case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
      case InputState.INVALID_ADDRESS_INPUT:
        showErrorPreview();
        break;

      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputState, validatedAsset, bypassFSM]);

  // Debug helpers
  const dumpInputFeed = useCallback(
    (header?: string) => {
      if (!DEBUG_ENABLED) return;
      dumpInputFeedContext(
        header ?? '',
        validHexInput,
        debouncedHexInput,
        failedHexInput,
        failedHexCount,
        isValid,
        instanceId,
      );
    },
    [
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      instanceId,
    ],
  );

  const dumpFSM = useCallback(
    (header?: string) => {
      if (!DEBUG_ENABLED) return;
      dumpFSMContext(
        header ?? '',
        inputState,
        validatedAsset as TokenContract | undefined,
        instanceId,
      );
      dumpInputFeed(header ?? '');
    },
    [inputState, validatedAsset, dumpInputFeed, instanceId],
  );

  return {
    inputState,
    setInputState,

    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange,
    resetHexInput,

    dumpInputFeed,
    dumpFSM,
  };
}
