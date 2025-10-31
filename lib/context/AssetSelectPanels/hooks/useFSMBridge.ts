// File: lib/context/AssetSelectPanels/hooks/useFSMBridge.ts
'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Address } from 'viem';

import type { FEED_TYPE, SP_COIN_DISPLAY, TokenContract, WalletAccount } from '@/lib/structure';
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

  // ⬇️ per-instance bypass
  bypassFSM?: boolean;
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
    bypassFSM = false,
  } = params;

  // DEBUG LOG TO BE REMOVED LATER
  console.log('[useFSMBridge] mount', {
    instanceId,
    containerType,
    feedType,
    peerAddress,
    manualEntry,
    bypassFSM,
  });

  const manualEntryRef = useRef(manualEntry);
  useEffect(() => {
    manualEntryRef.current = manualEntry;
    // DEBUG LOG TO BE REMOVED LATER
    console.log('[useFSMBridge] manualEntry ->', manualEntry, { instanceId });
  }, [manualEntry, instanceId]);

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
    bypassFSM,
  });

  // DEBUG: inputState transitions (prev → next)
  const prevStateRef = useRef<InputState>(inputState);
  useEffect(() => {
    if (prevStateRef.current !== inputState) {
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useFSMBridge] inputState transition', {
        instanceId,
        from: InputState[prevStateRef.current],
        to: InputState[inputState],
        manualEntryAtTransition: manualEntryRef.current,
        debouncedHexInput,
        bypassFSM,
      });
      prevStateRef.current = inputState;
    }
  }, [inputState, instanceId, debouncedHexInput, bypassFSM]);

  // Terminal transition guard (StrictMode-friendly)
  const didHandleTerminalRef = useRef(false);

  // Handle terminal states — muted while bypassing
  useEffect(() => {
    if (bypassFSM) {
      didHandleTerminalRef.current = false;
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useFSMBridge] bypassFSM active — terminal handlers muted', { instanceId });
      return;
    }

    if (inputState === InputState.UPDATE_VALIDATED_ASSET) {
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useFSMBridge] UPDATE_VALIDATED_ASSET reached', {
        instanceId,
        hasValidatedAsset: !!validatedAsset,
        manualEntryAtCommit: manualEntryRef.current,
      });

      if (didHandleTerminalRef.current) return;
      didHandleTerminalRef.current = true;

      if (!validatedAsset) {
        debugLog.warn?.(`[${instanceId}] UPDATE_VALIDATED_ASSET with no validatedAsset`);
      } else {
        // ⚠️ This is where a *manual* entry should NEVER auto-commit.
        // If we ever see manualEntryAtCommit === true here, something upstream didn’t gate it.
        // DEBUG LOG TO BE REMOVED LATER
        if (manualEntryRef.current) {
          console.warn(
            '[useFSMBridge] WARNING: manualEntry was TRUE at UPDATE_VALIDATED_ASSET — this should be gated upstream',
            { instanceId }
          );
        }

        debugLog.log?.(
          `[${instanceId}] ✅ commit validatedAsset → setTradingToken (manual=${manualEntryRef.current})`
        );
        fireSetTradingToken(validatedAsset);
      }
      setInputState(InputState.CLOSE_SELECT_PANEL, `Bridge(${instanceId}) commit → close`);
      return;
    }

    if (inputState === InputState.CLOSE_SELECT_PANEL) {
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useFSMBridge] CLOSE_SELECT_PANEL', {
        instanceId,
        handled: didHandleTerminalRef.current,
        hasValidatedAsset: !!validatedAsset,
      });

      if (!didHandleTerminalRef.current) {
        debugLog.warn?.(
          `[${instanceId}] CLOSE_SELECT_PANEL before commit (asset=${String(!!validatedAsset)})`
        );
      }
      try {
        fireClosePanel(true);
      } finally {
        // DEBUG LOG TO BE REMOVED LATER
        console.log('[useFSMBridge] CLOSE_SELECT_PANEL → cleanup & reset', { instanceId });
        resetPreview();
        setValidatedAsset(undefined);
        (resetHexInputExternal ?? resetHexInput)();
        didHandleTerminalRef.current = false;
        setInputState(InputState.EMPTY_INPUT, `Bridge(${instanceId}) closed`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputState, validatedAsset, bypassFSM]);

  // UI preview bridge — muted while bypassing
  useEffect(() => {
    if (bypassFSM) return;

    // DEBUG LOG TO BE REMOVED LATER
    console.log('[useFSMBridge] preview bridge', {
      instanceId,
      inputState: InputState[inputState],
      hasValidatedAsset: !!validatedAsset,
    });

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
  }, [inputState, validatedAsset, bypassFSM]);

  // Debug helpers
  const dumpInputFeed = useCallback(
    (header?: string) => {
      if (!DEBUG_ENABLED) return;
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useFSMBridge] dumpInputFeed()', { instanceId, header });
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
    [
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      instanceId,
    ]
  );

  const dumpFSM = useCallback(
    (header?: string) => {
      if (!DEBUG_ENABLED) return;
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useFSMBridge] dumpFSM()', { instanceId, header });
      dumpFSMContext(header ?? '', inputState, validatedAsset as TokenContract | undefined, instanceId);
      dumpInputFeed(header ?? '');
    },
    [inputState, validatedAsset, dumpInputFeed, instanceId]
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
