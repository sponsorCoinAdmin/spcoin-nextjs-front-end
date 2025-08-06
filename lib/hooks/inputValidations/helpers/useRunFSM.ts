// File: lib/hooks/inputValidations/helpers/useRunFSM.ts

'use client';

import { useEffect } from 'react';
import { usePublicClient, useChainId, useAccount } from 'wagmi';
import { InputState, SP_COIN_DISPLAY, FEED_TYPE, WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { runFSM } from './fsmRunner';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger('useRunFSM', DEBUG_ENABLED, LOG_TIME);

interface UseRunFSMParams {
  inputState: InputState;
  validHexInput: string;
  debouncedHexInput: string;
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;
  instanceId: string;

  traceRef: React.MutableRefObject<InputState[]>;
  setPendingTrace: (trace: InputState[]) => void;
  _setInputState: (state: InputState) => void;

  setValidatedAsset: (asset: WalletAccount | undefined) => void;
  closeCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: any) => void;
}

export function useRunFSM(params: UseRunFSMParams) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { address: accountAddress } = useAccount();

  useEffect(() => {
    if (!publicClient) {
      debugLog.warn('⚠️ publicClient is undefined, aborting FSM execution.');
      return;
    }

    let cancelled = false;

    runFSM({
      ...params,
      cancelled,
      publicClient,
      chainId,
      accountAddress,
      debugLog,
    });

    return () => {
      cancelled = true;
    };
  }, [
    params.inputState,
    params.debouncedHexInput,
    params.validHexInput,
    params.containerType,
    params.feedType,
    publicClient,
    chainId,
    accountAddress,
  ]);
}
