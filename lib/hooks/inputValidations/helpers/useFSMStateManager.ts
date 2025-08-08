// File: lib/hooks/inputValidations/helpers/useFSMStateManager.ts
'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  FEED_TYPE,
  InputState,
  SP_COIN_DISPLAY,
  WalletAccount,
} from '@/lib/structure';

import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { runFSM } from './fsmRunner';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('useFSMStateManager', DEBUG_ENABLED, LOG_TIME);

interface UseFSMStateManagerParams {
  debouncedHexInput: string;
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  instanceId: string;
  setValidatedAsset: (asset: WalletAccount | undefined) => void;
  closePanelCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: any) => void;
}

export function useFSMStateManager(params: UseFSMStateManagerParams) {
  const {
    debouncedHexInput,
    containerType,
    feedType,
    instanceId,
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
  } = params;

  const inputStateRef = useRef<InputState>(InputState.EMPTY_INPUT);
  const prevDebouncedInputRef = useRef<string | undefined>(undefined);

  const { address: accountAddress } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const prevParamsRef = useRef<UseFSMStateManagerParams | null>(null);

  // Optional: warn if critical params change
  useEffect(() => {
    const prev = prevParamsRef.current;
    if (prev) {
      const changes: string[] = [];
      if (prev.debouncedHexInput !== debouncedHexInput) changes.push(`debouncedHexInput\n  ${prev.debouncedHexInput} → ${debouncedHexInput}`);
      if (prev.containerType !== containerType) changes.push(`containerType\n  ${prev.containerType} → ${containerType}`);
      if (prev.feedType !== feedType) changes.push(`feedType\n  ${prev.feedType} → ${feedType}`);
      if (prev.instanceId !== instanceId) changes.push(`instanceId\n  ${prev.instanceId} → ${instanceId}`);
      if (prev.setValidatedAsset !== setValidatedAsset) changes.push('setValidatedAsset function changed');
      if (prev.closePanelCallback !== closePanelCallback) changes.push('closePanelCallback function changed');
      if (prev.setTradingTokenCallback !== setTradingTokenCallback) changes.push('setTradingTokenCallback function changed');
      if (changes.length > 0) {
        // alert(`⚠️ useFSMStateManager param changes:\n\n${changes.join('\n\n')}`);
      }
    }
    prevParamsRef.current = params;
  }, [debouncedHexInput, containerType, feedType, instanceId, setValidatedAsset, closePanelCallback, setTradingTokenCallback]);

  // FSM RUN LOOP
  useEffect(() => {
    if (!publicClient) {
      debugLog.warn('⚠️ publicClient is undefined, aborting FSM execution.');
      return;
    }

    // ✅ Prevent duplicate execution
    if (debouncedHexInput === prevDebouncedInputRef.current) {
      debugLog.log(`⏭️ Skipping FSM: debouncedHexInput unchanged → "${debouncedHexInput}"`);
      return;
    }

    if (!debouncedHexInput || debouncedHexInput.trim() === '') {
      debugLog.log('⏭️ Skipping FSM: debouncedHexInput is empty');
      return;
    }

    prevDebouncedInputRef.current = debouncedHexInput;

    debugLog.log(`🚀 Running FSM for input → "${debouncedHexInput}"`);

    runFSM({
      debouncedHexInput,
      containerType,
      feedType,
      publicClient,
      chainId,
      accountAddress: accountAddress ?? undefined,
      setValidatedAsset,
      closePanelCallback,
      setTradingTokenCallback,
    });
  }, [debouncedHexInput]);

  const setInputState = useCallback((next: InputState, source = 'useFSMStateManager') => {
    const prev = inputStateRef.current;
    if (prev === next) return;
    inputStateRef.current = next;

    debugLog.log(`🟢 setInputState: ${prev} → ${next} (from ${source})`);
  }, []);

  return {
    inputState: inputStateRef.current,
    setInputState,
  };
}
