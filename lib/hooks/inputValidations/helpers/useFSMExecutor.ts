'use client';
import { JUNK_ALERTS } from '@/lib/utils/JUNK_ALERTS';

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
import { isTerminalFSMState } from '../FSM_Core/fSMInputStates';
import { ValidateFSMOutput } from '../FSM_Core/types/validateFSMTypes';

const debugLog = createDebugLogger('useFSMExecutor', true, false);

interface FSMContextOverrides {
  sellAddress: string | undefined;
  buyAddress: string | undefined;
  chainId: number;
  publicClient: any;
  accountAddress: Address;
  seenBrokenLogosRef: React.MutableRefObject<Set<string>>;
  token?: TokenContract;
}

export function useFSMExecutor({
  sellAddress,
  buyAddress,
  chainId,
  publicClient,
  accountAddress,
  seenBrokenLogosRef,
  token,
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
    manualEntry,
    validHexInput: selectAddress,
  } = useSharedPanelContext();

  const prevDebouncedInputRef = useRef('');
  const queuedInputRef = useRef<string | null>(null);
  const fsmIsRunningRef = useRef(false);
  const lastFSMInputRef = useRef('');

  const runFSM = async () => {
    if (fsmIsRunningRef.current) {
      debugLog.warn(
        `🚫 [FSM TRIGGER BLOCKED] Already running. input="${debouncedHexInput}" state=${getInputStateString(inputState)}`
      );
      debugLog.log('⏳ [FSM BUSY] → queueing new input for retry after completion');
      queuedInputRef.current = debouncedHexInput;
      return;
    }

    fsmIsRunningRef.current = true;
    debugLog.log(`🧵 [FSM START] input="${debouncedHexInput}" starting at state=${getInputStateString(inputState)}`);

    try {
      let currentState = inputState;
      let result: ValidateFSMOutput|undefined;

      while (!isTerminalFSMState(currentState)) {
        result = await validateFSMCore({
          inputState: currentState,
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
          stateTrace: [currentState],
          manualEntry,
        });

        dumpSharedPanelContext?.(`[FSM STEP] ${getInputStateString(currentState)} → ${getInputStateString(result.nextState)}`);

        if (!result || result.nextState === currentState) {
          debugLog.warn(`🛑 FSM halted at ${getInputStateString(currentState)} → no transition or loop detected`);
          break;
        }

        if (result.stateTrace?.length) {
          debugLog.log(`📜 FSM State Trace:`);
          result.stateTrace.forEach((s, idx) =>
            debugLog.log(`  ${idx + 1}. ${getInputStateString(s)} (${s})`)
          );
          const summary = result.stateTrace.map(getInputStateString).join(' → ');
          debugLog.log(`🧭 FSM Path: ${summary}`);
        }

         currentState = result.nextState;
      }
      
      // JUNK_ALERTS(`currentState=${getInputStateString(currentState)} result=${JSON.stringify(result)}`)
      if (result) {
               // Apply intermediate state update for debug or UI
        setInputState(result.nextState, 'useFSMExecutor loop');
        // Save validated asset (only done at UPDATE_VALIDATED_ASSET)
        if (result.nextState === InputState.UPDATE_VALIDATED_ASSET) {
          if (result.validatedToken) {
            setValidatedToken(result.validatedToken);
          } else if (result.validatedWallet) {
            setValidatedWallet(result.validatedWallet);
          }
        }
      }

      prevDebouncedInputRef.current = debouncedHexInput;
      lastFSMInputRef.current = debouncedHexInput;
    } catch (err: any) {
      debugLog.error('❌ [FSM ERROR]', {
        message: err?.message || 'Unknown error',
        name: err?.name,
        stack: err?.stack,
      });
      debugLog.error(
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
      dumpSharedPanelContext?.(`[AFTER FSM COMPLETE]`);

      debugLog.log(`[FSM QUEUE CHECK] queued="${queuedInputRef.current}" prev="${prevDebouncedInputRef.current}"`);

      if (queuedInputRef.current && queuedInputRef.current !== prevDebouncedInputRef.current) {
        debugLog.log('🔁 Re-running FSM with queued input');
        setInputState(InputState.VALIDATE_ADDRESS, 'useFSMExecutor queue');
        prevDebouncedInputRef.current = queuedInputRef.current;
        queuedInputRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (!selectAddress?.trim() && inputState !== InputState.EMPTY_INPUT) {
      setInputState(InputState.EMPTY_INPUT, 'useFSMExecutor clear');
    }
  }, [selectAddress]);

  return { runFSM };
}
