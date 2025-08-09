// File: lib/hooks/inputValidations/FSM_Core/useFSMStateManager.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FEED_TYPE,
  InputState,
  SP_COIN_DISPLAY,
  WalletAccount,
  TokenContract,
} from '@/lib/structure';

import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useHexInput } from '@/lib/hooks/useHexInput';

// Helpers live one level up
import { startFSMExecution } from '../helpers/startFSMExecution';
import { logStateChanges } from '../helpers/logStateChanges';
import { handleTerminalState } from '../helpers/handleTerminalState';

const debugLog = createDebugLogger(
  'useFSMStateManager',
  process.env.NEXT_PUBLIC_DEBUG_FSM === 'true'
);

interface UseFSMStateManagerParams {
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  instanceId: string;
  validatedAsset?: TokenContract | undefined;
  setValidatedAsset: (asset: WalletAccount | TokenContract | undefined) => void;
  closePanelCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: any) => void;
}

export function useFSMStateManager(params: UseFSMStateManagerParams) {
  const {
    containerType,
    feedType,
    instanceId,
    validatedAsset,
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
        'setValidatedAsset',
        'closePanelCallback',
        'setTradingTokenCallback',
      ],
      'useFSMStateManager param changes'
    );
    prevParamsRef.current = params;
  }, [containerType, feedType, instanceId, setValidatedAsset, closePanelCallback, setTradingTokenCallback, params]);

  // FSM runner
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await startFSMExecution({
        debouncedHexInput,
        prevDebouncedInputRef,
        publicClient,
        chainId,
        accountAddress,
        containerType,
        feedType,
        setValidatedAsset,
        closePanelCallback,
        setTradingTokenCallback,
        // ✅ include precheck details expected by startFSMExecution
        isValid,
        failedHexInput,
      });

      if (cancelled || result === null) return;

      setInputStateWrapped(result, 'post-run');

      handleTerminalState({
        state: result,
        validatedAsset,
        setValidatedAsset,
        setTradingTokenCallback,
        setInputState: setInputStateWrapped,
        closePanelCallback,
      });
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
    validatedAsset,
    setInputStateWrapped,
    isValid,
    failedHexInput,
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

// ✅ Also export default to be extra tolerant to import styles
export default useFSMStateManager;
