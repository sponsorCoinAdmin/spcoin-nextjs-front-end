// File: lib/context/AssetSelectPanels/hooks/useFSMBridge.ts
'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Address } from 'viem';

import { FEED_TYPE, SP_COIN_DISPLAY, TokenContract, WalletAccount } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';
import { useFSMStateManager } from '@/lib/hooks/inputValidations/FSM_Core/useFSMStateManager';
import { dumpFSMContext, dumpInputFeedContext } from '@/lib/hooks/inputValidations/utils/debugContextDump';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_FSM === 'true';
const debugLog = createDebugLogger('useFSMBridge', DEBUG_ENABLED, LOG_TIME);

type BridgeParams = {
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  instanceId: string;
  peerAddress?: Address | string;
  manualEntry: boolean;

  validatedAsset?: TokenContract | WalletAccount;
  setValidatedAsset: (next?: TokenContract | WalletAccount) => void;

  fireClosePanel: (fromUser: boolean) => void;
  fireSetTradingToken: (asset: TokenContract | WalletAccount) => void;

  // UI preview funcs
  resetPreview: () => void;
  showAssetPreview: () => void;
  showErrorPreview: () => void;

  // (optional) external reset injection
  resetHexInputExternal?: (() => void) | undefined;
};

export function useFSMBridge(params: BridgeParams) {
  const {
    containerType,
    feedType,
    instanceId,
    peerAddress,
    manualEntry,
    validatedAsset,
    setValidatedAsset,
    fireClosePanel,
    fireSetTradingToken,
    resetPreview,
    showAssetPreview,
    showErrorPreview,
    resetHexInputExternal,
  } = params;

  const manualEntryRef = useRef(manualEntry);
  useEffect(() => { manualEntryRef.current = manualEntry; }, [manualEntry]);

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
    setValidatedAsset,
    closePanelCallback: fireClosePanel,
    setTradingTokenCallback: fireSetTradingToken,
    peerAddress,
    manualEntry: manualEntryRef.current,
  });

  // Terminal transition guard (StrictMode-friendly)
  const didHandleTerminalRef = useRef(false);

  // Handle terminal states
  useEffect(() => {
    if (inputState === InputState.UPDATE_VALIDATED_ASSET) {
      if (didHandleTerminalRef.current) return;
      didHandleTerminalRef.current = true;

      if (!validatedAsset) {
        debugLog.warn?.(`[${instanceId}] UPDATE_VALIDATED_ASSET with no validatedAsset`);
      } else {
        debugLog.log?.(`[${instanceId}] ✅ commit validatedAsset → setTradingToken`);
        fireSetTradingToken(validatedAsset);
      }
      setInputState(InputState.CLOSE_SELECT_PANEL, `Bridge(${instanceId}) commit → close`);
      return;
    }

    if (inputState === InputState.CLOSE_SELECT_PANEL) {
      if (!didHandleTerminalRef.current) {
        debugLog.warn?.(
          `[${instanceId}] CLOSE_SELECT_PANEL before commit (asset=${String(!!validatedAsset)})`,
        );
      }
      try {
        fireClosePanel(true);
      } finally {
        debugLog.log?.(`[${instanceId}] ♻️ reset after close`);
        resetPreview();
        setValidatedAsset(undefined);
        (resetHexInputExternal ?? resetHexInput)();
        didHandleTerminalRef.current = false;
        setInputState(InputState.EMPTY_INPUT, `Bridge(${instanceId}) closed`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputState, validatedAsset]);

  // UI preview bridge
  useEffect(() => {
    switch (inputState) {
      case InputState.EMPTY_INPUT:
        resetPreview();
        break;
      case InputState.RESOLVE_ASSET:
        if (validatedAsset) showAssetPreview();
        break;
      case InputState.TOKEN_NOT_RESOLVED_ERROR:
      case InputState.RESOLVE_ASSET_ERROR:
        showErrorPreview();
        break;
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputState, validatedAsset]);

  // Debug helpers (keep signatures compatible with old provider)
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
      dumpFSMContext(header ?? '', inputState, validatedAsset as TokenContract | undefined, instanceId);
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
