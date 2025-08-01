// File: lib/hooks/inputValidations/helpers/useFSMExecutor.ts

import { useRef, useEffect } from 'react';
import { Address } from 'viem';
import {
  InputState,
  TokenContract,
  WalletAccount,
  getInputStateString,
} from '@/lib/structure';

import { validateFSMCore } from '../FSM_Core/validateFSMCore';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { isTriggerFSMState } from '../FSM_Core/fSMInputStates'; // ✅ imported helper

const debugLog = createDebugLogger('useFSMExecutor', true, false);

interface FSMContextOverrides {
  sellAddress: string | undefined;
  buyAddress: string | undefined;
  chainId: number;
  publicClient: any;
  accountAddress: Address;
  seenBrokenLogosRef: React.MutableRefObject<Set<string>>;
  token?: TokenContract;
  selectAddress?: string;
  manualEntry: boolean;
}

export function useFSMExecutor({
  sellAddress,
  buyAddress,
  chainId,
  publicClient,
  accountAddress,
  seenBrokenLogosRef,
  token,
  selectAddress,
  manualEntry,
}: FSMContextOverrides) {
  const {
    inputState,
    debouncedHexInput,
    setInputState,
    feedType,
    containerType,
    setValidatedToken,
    setValidatedWallet,
    dumpSharedPanelContext,
  } = useSharedPanelContext();

  const prevDebouncedInputRef = useRef('');
  const queuedInputRef = useRef<string | null>(null);
  const fsmIsRunningRef = useRef(false);
  const lastFSMInputRef = useRef('');

  const runFSM = async () => {
    if (!isTriggerFSMState(inputState)) {
      debugLog.warn(`⚠️ [DEV WARNING] runFSM() called with non-trigger state: ${getInputStateString(inputState)}`);
      return;
    }

    if (fsmIsRunningRef.current) {
      debugLog.log('⏳ [FSM BUSY] → queueing new input');
      queuedInputRef.current = debouncedHexInput;
      return;
    }

    fsmIsRunningRef.current = true;
    debugLog.log(`🧵 [FSM START] state=${getInputStateString(inputState)} input="${debouncedHexInput}"`);

    try {
      const result = await validateFSMCore({
        inputState,
        debouncedHexInput,
        seenBrokenLogos: seenBrokenLogosRef.current,
        containerType,
        sellAddress,
        buyAddress,
        chainId,
        publicClient,
        accountAddress,
        feedType,
        validatedToken: token,
        stateTrace: [inputState],
        manualEntry,
      });

      dumpSharedPanelContext?.(`[AFTER FSM] nextState=${getInputStateString(result.nextState)}`);

      if (result.stateTrace?.length) {
        debugLog.log(`📜 FSM State Trace:`);
        result.stateTrace.forEach((s, idx) =>
          debugLog.log(`  ${idx + 1}. ${getInputStateString(s)} (${s})`)
        );
        const summary = result.stateTrace.map((s) => getInputStateString(s)).join(' → ');
        debugLog.log(`🧭 FSM Path: ${summary}`);
      }

      if (result.nextState !== inputState) {
        setInputState(result.nextState);
      }

      if (result.nextState === InputState.UPDATE_VALIDATED_ASSET) {
        if (result.validatedToken) {
          setValidatedToken(result.validatedToken);
        } else if (result.validatedWallet) {
          setValidatedWallet(result.validatedWallet);
        }
      }

      prevDebouncedInputRef.current = debouncedHexInput;
      lastFSMInputRef.current = debouncedHexInput;
    } catch (err: any) {
      debugLog.log('❌ [FSM ERROR]', {
        message: err?.message || 'Unknown error',
        name: err?.name,
        stack: err?.stack,
      });
      debugLog.log(
        '🚨 [FSM ERROR CONTEXT]',
        stringifyBigInt({
          inputState: getInputStateString(inputState),
          debouncedHexInput,
          chainId,
          accountAddress,
          feedType,
          tokenProvided: !!token,
          manualEntry,
        })
      );
    } finally {
      fsmIsRunningRef.current = false;
      dumpSharedPanelContext?.(`[AFTER FSM UPDATE]`);

      debugLog.log(`[FSM QUEUE CHECK] queued="${queuedInputRef.current}" prev="${prevDebouncedInputRef.current}"`);

      if (queuedInputRef.current && queuedInputRef.current !== prevDebouncedInputRef.current) {
        debugLog.log('🔁 Re-running FSM with queued input');
        setInputState(InputState.VALIDATE_ADDRESS);
        prevDebouncedInputRef.current = queuedInputRef.current;
        queuedInputRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (!selectAddress?.trim() && inputState !== InputState.EMPTY_INPUT) {
      setInputState(InputState.EMPTY_INPUT);
    }
  }, [selectAddress]);

  return { runFSM };
}
