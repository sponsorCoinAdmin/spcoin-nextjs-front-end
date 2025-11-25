// File: @/lib/hooks/inputValidations/FSM_Core/useFSMStateManager.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  WalletAccount,
  TokenContract,
} from '@/lib/structure';

import { useAccount } from 'wagmi';
import { useAppChainId } from '@/lib/context/hooks';
import { useAppPublicClient } from '@/lib/hooks/useAppPublicClient';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useHexInput } from '@/lib/hooks/useHexInput';

import { startFSM } from '../helpers/fsm/startFSM';
import { logStateChanges } from '../helpers/logStateChanges';
import { InputState } from '@/lib/structure/assetSelection';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('useFSMStateManager', DEBUG_ENABLED, LOG_TIME);

interface UseFSMStateManagerParams {
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  instanceId: string;
  peerAddress?: string;
  manualEntry?: boolean;

  // ⬇️ NEW: per-instance bypass (prop-driven)
  bypassFSM?: boolean;

  setValidatedAsset: (asset: WalletAccount | TokenContract | undefined) => void;
  closePanelCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: any) => void;
}

export function useFSMStateManager(params: UseFSMStateManagerParams) {
  const {
    containerType,
    feedType,
    instanceId,
    peerAddress,
    manualEntry,
    bypassFSM = false,
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
  } = params;

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

  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);

  const setInputStateWrapped = useCallback(
    (next: InputState, source = 'useFSMStateManager') =>
      setInputState((prev) => {
        if (prev === next) return prev;

        if (
          next === InputState.EMPTY_INPUT &&
          debouncedHexInput &&
          source !== 'useFSMStateManager'
        ) {
          debugLog.warn?.(
            `⚠️ [${instanceId}] setInputState(EMPTY_INPUT) requested by "${source}" while debouncedHexInput="${debouncedHexInput}"`,
          );
        }

        debugLog.log?.(
          `🟢 [${instanceId}] setInputState: ${InputState[prev]} → ${InputState[next]} (${source})`,
        );
        return next;
      }),
    [debouncedHexInput, instanceId],
  );

  const prevDebouncedInputRef = useRef<string | undefined>(undefined);
  const manualEntryRef = useRef<boolean>(manualEntry ?? false);

  useEffect(() => {
    manualEntryRef.current = manualEntry ?? false;
  }, [manualEntry]);

  const { address: accountAddress } = useAccount();
  const [chainId] = useAppChainId();
  const publicClient = useAppPublicClient();

  useEffect(() => {
    const clientChainId = (publicClient as any)?.chain?.id ?? '∅';
    debugLog.log?.('[useFSMStateManager] publicClient pinned', {
      instanceId,
      expectedChainId: chainId,
      clientChainId,
    });
  }, [publicClient, chainId, instanceId]);

  const prevParamsRef = useRef<UseFSMStateManagerParams | null>(null);
  useEffect(() => {
    logStateChanges(
      prevParamsRef.current,
      params,
      [
        'containerType',
        'feedType',
        'instanceId',
        'peerAddress',
        'manualEntry',
        'bypassFSM',
        'setValidatedAsset',
        'closePanelCallback',
        'setTradingTokenCallback',
      ],
      'useFSMStateManager param changes',
    );
    prevParamsRef.current = params;
  }, [
    containerType,
    feedType,
    instanceId,
    peerAddress,
    manualEntry,
    bypassFSM,
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
    params,
  ]);

  // Allow a fresh run if we got reset to EMPTY_INPUT but still have input
  useEffect(() => {
    if (inputState === InputState.EMPTY_INPUT && debouncedHexInput) {
      prevDebouncedInputRef.current = undefined;
      debugLog.log?.(
        `🔁 [${instanceId}] Cleared prevDebouncedInputRef to allow re-run (state EMPTY_INPUT, debounced="${debouncedHexInput}")`,
      );
    }
  }, [inputState, debouncedHexInput, instanceId]);

  // ⛔ BYPASS HANDLER: when bypass turns on, keep state calm and skip runner
  useEffect(() => {
    if (!bypassFSM) return;
    debugLog.warn?.(
      `⏭️ [${instanceId}] FSM BYPASS ACTIVE — skipping startFSM runner`,
    );
    // ensure we don't sit in a terminal state
    if (inputState !== InputState.EMPTY_INPUT) {
      setInputStateWrapped(InputState.EMPTY_INPUT, 'bypass-init');
    }
    // also clear the “unchanged input” guard so if bypass turns off later, it can run
    prevDebouncedInputRef.current = undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bypassFSM]);

  // FSM runner (disabled when bypassFSM)
  useEffect(() => {
    if (bypassFSM) return;

    let cancelled = false;

    (async () => {
      const result = await startFSM({
        debouncedHexInput,
        prevDebouncedInputRef,
        publicClient,
        chainId,
        accountAddress,
        containerType,
        feedType,
        peerAddress,
        manualEntry: manualEntryRef.current,
        isValid,
        failedHexInput,
        closePanelCallback,
      });

      if (cancelled || result === null) return;

      setInputStateWrapped(result.finalState, 'post-run');

      if ('asset' in result && result.asset) {
        try {
          setValidatedAsset(result.asset);
          if (
            result.finalState === InputState.RETURN_VALIDATED_ASSET ||
            result.finalState === InputState.CLOSE_SELECT_PANEL
          ) {
            setTradingTokenCallback(result.asset);
          }
        } catch (err) {
          debugLog.error?.(
            '❌ centralized commit failed in useFSMStateManager:',
            err,
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    bypassFSM,
    debouncedHexInput,
    containerType,
    feedType,
    publicClient,
    chainId,
    accountAddress,
    closePanelCallback,
    setInputStateWrapped,
    isValid,
    failedHexInput,
    peerAddress,
    setValidatedAsset,
    setTradingTokenCallback,
  ]);

  return {
    inputState,
    setInputState: setInputStateWrapped,

    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange,
    resetHexInput,
  };
}

export default useFSMStateManager;
