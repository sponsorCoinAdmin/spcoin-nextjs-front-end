// File: lib/hooks/inputValidations/FSM_Core/useFSMStateManager.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  WalletAccount,
  TokenContract,
} from '@/lib/structure';

import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useHexInput } from '@/lib/hooks/useHexInput';

import { startFSMExecution } from '../helpers/startFSMExecution';
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

  // Side-effect callbacks are forwarded to the FSM core via the runner
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
  const setInputStateWrapped = useCallback(
    (next: InputState, source = 'useFSMStateManager') =>
      setInputState(prev => {
        if (prev === next) return prev;
        debugLog.log(`🟢 setInputState: ${prev} → ${next} (${source})`);
        return next;
      }),
    []
  );

  const prevDebouncedInputRef = useRef<string | undefined>(undefined);
  const manualEntryRef = useRef<boolean>(manualEntry ?? false); // ref-backed to avoid races

  // keep the ref synced with latest provider state
  useEffect(() => {
    manualEntryRef.current = manualEntry ?? false;
    // 🔔 TRACE: show when the snapshot value changes
    // alert(`[useFSMStateManager] sync manualEntry -> ${String(manualEntryRef.current)}`);
  }, [manualEntry]);

  const { address: accountAddress } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  // Log param changes (dev aid)
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
    params,
  ]);

  // FSM runner
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 🔔 TRACE: show the exact snapshot we’re about to pass
      // alert(
      //   `[useFSMStateManager] calling startFSMExecution with ` +
      //   `manualEntry=${String(manualEntryRef.current)}, ` +
      //   `peerAddress=${peerAddress ?? 'none'}, ` +
      //   `debouncedHexInput=${debouncedHexInput || '(empty)'}`
      // );

      const result = await startFSMExecution({
        debouncedHexInput,
        prevDebouncedInputRef,
        publicClient,
        chainId,
        accountAddress,
        containerType,
        feedType,
        peerAddress,                       // → runner
        manualEntry: manualEntryRef.current, // → freshest value
        setValidatedAsset,
        closePanelCallback,
        setTradingTokenCallback,
        // precheck details from input hook
        isValid,
        failedHexInput,
      });

      if (cancelled || result === null) return;

      setInputStateWrapped(result, 'post-run');
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
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
    setInputStateWrapped,
    isValid,
    failedHexInput,
    peerAddress, // rerun when opposite-side selection changes
    // NOTE: do not depend on `manualEntry`; we read from ref to avoid races
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
