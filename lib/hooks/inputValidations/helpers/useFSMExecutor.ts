// File: lib/hooks/inputValidations/helpers/useFSMExecutor.ts

'use client';

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
import { displayStateTransitions } from '@/components/debug/FSMTracePanel';

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

let fsmInstanceCounter = 0;

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
    const fsmInstanceId = ++fsmInstanceCounter;

    debugLog.log(`🧵 [FSM START] instance=${fsmInstanceId} input="${debouncedHexInput}" starting at state=${getInputStateString(inputState)}`);

    const stateTrace: number[] = [];

    const summary = `
⚙️ FSM Input Debug:
───────────────────────────────
inputState:    ${getInputStateString(inputState)} (${inputState})
feedType:      ${feedType}
containerType: ${containerType}
debouncedHex:  ${debouncedHexInput}
sellAddress:   ${sellAddress || 'none'}
buyAddress:    ${buyAddress || 'none'}
chainId:       ${chainId}
accountAddr:   ${accountAddress || 'none'}
validatedTok:  ${token?.symbol || 'none'}
manualEntry:   ${manualEntry === true ? 'true' : 'false'}
───────────────────────────────
`.trim();

    console.log(summary);

    if (typeof window !== 'undefined') {
      localStorage.setItem('latestFSMHeader', summary);
      (window as any).__FSM_HEADER__ = summary;
    }

    try {
      let currentState = inputState;
      let result: ValidateFSMOutput | undefined;

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
          stateTrace: [...stateTrace],
          manualEntry,
        });

        stateTrace.push(currentState, result.nextState);

        const prevStateStr = getInputStateString(currentState);
        const nextStateStr = getInputStateString(result.nextState);

        const transitionMsg = `[FSM instance: ${fsmInstanceId}] ${prevStateStr}(${currentState}) → ${nextStateStr}[${result.nextState}]`;

        console.log(transitionMsg);

        if (dumpSharedPanelContext && result.nextState !== currentState) {
          dumpSharedPanelContext(`[FSM STEP] ${prevStateStr} → ${nextStateStr}`);
        }

        if (!result || result.nextState === currentState) {
          debugLog.warn(`🚸 FSM halted at ${prevStateStr} → no transition or loop detected`);
          break;
        }

        setInputState(result.nextState, `runFSM [instance: ${fsmInstanceId}]`);
        currentState = result.nextState;
      }

      const traceSummary = stateTrace.map(getInputStateString).join(' → ');
      debugLog.log(`📊 FSM Trace Summary: ${traceSummary}`);

      const fsmTraceOutput = displayStateTransitions(stateTrace);
      console.log(fsmTraceOutput);

      if (typeof window !== 'undefined') {
        localStorage.setItem('latestFSMTraceLines', fsmTraceOutput);
        (window as any).__FSM_TRACE_LINES__ = fsmTraceOutput;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('latestFSMTrace', JSON.stringify(stateTrace));
        (window as any).__FSM_TRACE__ = stateTrace;
      }

      if (result) {
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

      if (
        queuedInputRef.current &&
        queuedInputRef.current !== prevDebouncedInputRef.current
      ) {
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