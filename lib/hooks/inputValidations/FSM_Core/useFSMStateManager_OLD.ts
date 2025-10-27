// File: lib/hooks/inputValidations/FSM_Core/useFSMStateManager.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  WalletAccount,
  TokenContract,
} from '@/lib/structure';

import { useAccount, usePublicClient } from 'wagmi';
import { useAppChainId } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useHexInput } from '@/lib/hooks/useHexInput';

// ⬇️ unified runner (return-only; no side-effects for asset)
import { startFSM } from '../helpers/fsm/startFSM';
import { logStateChanges } from '../helpers/logStateChanges';
import { InputState } from '@/lib/structure/assetSelection';

const debugLog = createDebugLogger(
  'useFSMStateManager',
  process.env.NEXT_PUBLIC_DEBUG_FSM === 'true'
);

interface UseFSMStateManagerParams {
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  instanceId: string;

  /** Opposite side’s committed address (BUY panel gets SELL’s, SELL panel gets BUY’s) */
  peerAddress?: string;

  /** Whether current input was typed manually (true) vs chosen from list (false) */
  manualEntry?: boolean;

  // Centralized commits happen in this hook
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
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
  } = params;

  // Own the input feed here
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

  /**
   * Wrapped setter (no hard blocks).
   * - Logs state transitions with instanceId.
   * - Soft-warns if someone tries to force EMPTY_INPUT while debounced input is non-empty,
   *   but DOES NOT block (to avoid interfering with input).
   */
  const setInputStateWrapped = useCallback(
    (next: InputState, source = 'useFSMStateManager') =>
      setInputState(prev => {
        if (prev === next) return prev;

        if (
          next === InputState.EMPTY_INPUT &&
          debouncedHexInput && // non-empty
          source !== 'useFSMStateManager'
        ) {
          debugLog.warn(
            `⚠️ [${instanceId}] setInputState(EMPTY_INPUT) requested by "${source}" while debouncedHexInput="${debouncedHexInput}"`
          );
        }

        debugLog.log(
          `🟢 [${instanceId}] setInputState: ${InputState[prev]} → ${InputState[next]} (${source})`
        );
        return next;
      }),
    [debouncedHexInput, instanceId]
  );

  const prevDebouncedInputRef = useRef<string | undefined>(undefined);
  const manualEntryRef = useRef<boolean>(manualEntry ?? false); // ref-backed to avoid races

  // keep the ref synced with latest prop
  useEffect(() => {
    manualEntryRef.current = manualEntry ?? false;
  }, [manualEntry]);

  const { address: accountAddress } = useAccount();

  // ✅ Canonical chain id from app context
  const [chainId] = useAppChainId();

  // ✅ Public client **pinned** to the app chain (fixes accidental mainnet reads)
  const publicClient = usePublicClient({ chainId });

  // Optional: tiny debug to confirm pinning at runtime
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(
      `[useFSMStateManager:${instanceId}] usePublicClient pinned -> expected=${chainId}, clientChainId=${(publicClient as any)?.chain?.id ?? '∅'}`
    );
  }, [publicClient, chainId, instanceId]);

  // Log select param changes (dev aid)
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
        'setValidatedAsset',
        'closePanelCallback',
        'setTradingTokenCallback',
      ],
      'useFSMStateManager param changes'
    );
    prevParamsRef.current = params;
  }, [
    containerType,
    feedType,
    instanceId,
    peerAddress,
    manualEntry,
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
  ]);

  /**
   * Allow a fresh FSM run if something reset us to EMPTY_INPUT
   * while the debounced input is still non-empty.
   * This clears the "unchanged input" guard inside startFSM.
   */
  useEffect(() => {
    if (inputState === InputState.EMPTY_INPUT && debouncedHexInput) {
      prevDebouncedInputRef.current = undefined;
      debugLog.log(
        `🔁 [${instanceId}] Cleared prevDebouncedInputRef to allow re-run (state EMPTY_INPUT, debounced="${debouncedHexInput}")`
      );
    }
  }, [inputState, debouncedHexInput, instanceId]);

  // FSM runner
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await startFSM({
        debouncedHexInput,
        prevDebouncedInputRef,
        publicClient,          // ✅ now pinned to chainId
        chainId,               // ✅ canonical chain id in ValidateFSMInput
        accountAddress,
        containerType,
        feedType,
        peerAddress,                         // → runner
        manualEntry: manualEntryRef.current, // → freshest value
        // precheck details from input hook
        isValid,
        failedHexInput,
        // keep closePanelCallback (validators may need it)
        closePanelCallback,
      });

      if (cancelled || result === null) return;

      // Authoritative state commit
      setInputStateWrapped(result.finalState, 'post-run');

      // Provide asset to host; only "commit" trading token on commit states
      if ('asset' in result && result.asset) {
        try {
          setValidatedAsset(result.asset);
          if (
            result.finalState === InputState.UPDATE_VALIDATED_ASSET ||
            result.finalState === InputState.CLOSE_SELECT_PANEL
          ) {
            setTradingTokenCallback(result.asset);
          }
        } catch (err) {
          debugLog.error('❌ centralized commit failed in useFSMStateManager:', err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
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

    // expose input feed
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
