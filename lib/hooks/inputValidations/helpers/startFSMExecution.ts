// File: lib/hooks/inputValidations/helpers/startFSMExecution.ts
'use client';

import { MutableRefObject } from 'react';
import { InputState, SP_COIN_DISPLAY_NEW, FEED_TYPE } from '@/lib/structure';
import { runFSM } from './fsmRunner';
import { getPrevTrace } from './fsmStorage';

type Args = {
  debouncedHexInput: string;
  prevDebouncedInputRef: MutableRefObject<string | undefined>;
  publicClient: any;
  chainId: number;
  accountAddress?: string;
  containerType: SP_COIN_DISPLAY_NEW;
  feedType: FEED_TYPE;

  /** Whether the input was typed manually (true) vs chosen from list (false) */
  manualEntry?: boolean;

  /** Opposite side’s committed address for duplicate detection */
  peerAddress?: string;

  // side-effect callbacks (forwarded to FSM core tests)
  setValidatedAsset: (a: any) => void;
  closePanelCallback: (b: boolean) => void;
  setTradingTokenCallback: (t: any) => void;

  // precheck info from input hook
  isValid: boolean;
  failedHexInput?: string;
};

/**
 * Kick off the FSM for the current input and return the final state.
 * Returns null if the debounced input hasn't changed (no-op).
 */
export async function startFSMExecution(args: Args): Promise<InputState | null> {
  const {
    debouncedHexInput,
    prevDebouncedInputRef,
    publicClient,
    chainId,
    accountAddress,
    containerType,
    feedType,
    peerAddress,
    manualEntry,              // ✅ include in destructuring
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
    isValid,
    failedHexInput,
  } = args;

  // No-op if the debounced input hasn't changed
  if (prevDebouncedInputRef.current === debouncedHexInput) {
    return null;
  }
  prevDebouncedInputRef.current = debouncedHexInput;

  // Run the FSM (this writes the trace internally)
  await runFSM({
    debouncedHexInput,
    containerType,
    feedType,
    publicClient,
    chainId,
    accountAddress,
    peerAddress,      // → runner
    manualEntry,      // → runner
    setValidatedAsset,
    closePanelCallback,
    setTradingTokenCallback,
    isValid,
    failedHexInput,
  });

  // Read final state from the accumulated trace
  const trace = getPrevTrace();
  const finalState = trace.at(-1) ?? InputState.VALIDATE_ADDRESS;
  return finalState;
}
