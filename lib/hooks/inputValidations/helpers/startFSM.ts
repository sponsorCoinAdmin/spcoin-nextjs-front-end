// File: lib/hooks/inputValidations/helpers/startFSM.ts
'use client';

import { MutableRefObject } from 'react';
import {
  SP_COIN_DISPLAY,
  FEED_TYPE,
  WalletAccount,
  TokenContract,
} from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

import { validateFSMCore } from '../FSM_Core/validateFSMCore';
import type {
  ValidateFSMInput,
  ValidateFSMOutput,
} from '../FSM_Core/types/validateFSMTypes';

import { Address, zeroAddress } from 'viem';

import { getPrevTrace, setTrace, appendLines } from './fsmStorage';
import { formatTrace, headerLine, SEP_LINE } from './fsmFormat';
import { getStateIcon } from './fsmTraceUtils';
import { isTriggerFSMState } from '../FSM_Core/fSMInputStates';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const debug = createDebugLogger('startFSM', process.env.NEXT_PUBLIC_DEBUG_FSM === 'true');

export type StartFSMArgs = {
  // Guards / identity
  debouncedHexInput: string;
  prevDebouncedInputRef: MutableRefObject<string | undefined>;

  // Environment
  publicClient: any;
  chainId: number;
  accountAddress?: string;

  // Routing
  containerType: SP_COIN_DISPLAY;
  feedType: FEED_TYPE;

  // Semantics
  manualEntry?: boolean;
  peerAddress?: string;

  // Precheck info (forwarded to core)
  isValid: boolean;
  failedHexInput?: string;

  // UI actions still used by validators (e.g., closing panel)
  closePanelCallback: (fromUser: boolean) => void;
};

// What the hook receives (no side-effects done here)
export type StartFSMResult = {
  finalState: InputState;
  // Present on preview or commit states; undefined otherwise
  asset?: WalletAccount | TokenContract;
} | null;

/**
 * Canonical entrypoint to run the FSM once (no asset side-effects).
 * - Performs env + signature guards
 * - Executes the FSM loop
 * - Persists the trace
 * - Returns { finalState, asset? } or null if skipped by guards
 */
export async function startFSM(args: StartFSMArgs): Promise<StartFSMResult> {
  const {
    debouncedHexInput,
    prevDebouncedInputRef,
    publicClient,
    chainId,
    accountAddress,
    containerType,
    feedType,
    peerAddress,
    manualEntry,
    isValid,
    failedHexInput,
    closePanelCallback,
  } = args;

  // ───────── Guards ─────────
  debug.log(
    `↪️ enter: input="${debouncedHexInput || '(empty)'}", isValid=${isValid}, failed="${failedHexInput ?? '—'}", ` +
    `manual=${String(manualEntry)}, peer=${peerAddress ?? '—'}, chainId=${chainId}`
  );

  if (!publicClient || !chainId) {
    debug.warn('⛔ Missing publicClient/chainId — skipping FSM run.');
    return null;
  }

  // Signature gate — rerun only when (debouncedHexInput, isValid) changes
  const signature = `${debouncedHexInput}|${isValid ? 1 : 0}`;
  if (prevDebouncedInputRef.current === signature) {
    debug.log(`⏸️ Unchanged signature "${signature}" — skipping FSM run.`);
    return null;
  }
  prevDebouncedInputRef.current = signature;

  // ───────── FSM Loop ─────────
  const prevTrace = getPrevTrace();
  const prevLast: InputState | undefined = prevTrace.at(-1);

  const runTrace: InputState[] = [];
  let fSMState: InputState = InputState.VALIDATE_ADDRESS;
  runTrace.push(fSMState);

  // No-ops to keep validators harmless if they call these
  const noop = () => {};
  const current: ValidateFSMInput = {
    inputState: fSMState,
    debouncedHexInput,

    // forwarded precheck info
    isValid,
    failedHexInput,

    // environment / routing
    containerType,
    feedType,
    chainId,
    publicClient,
    accountAddress: (accountAddress ?? zeroAddress) as Address,

    // semantics
    manualEntry: manualEntry ?? true,
    peerAddress,

    // side-effect callbacks used by validators (neutralized here)
    setValidatedAsset: noop,
    setTradingTokenCallback: noop,
    closePanelCallback,

    // utilities
    seenBrokenLogos: new Set<string>(),

    // accumulator snapshot (filled below)
    resolvedAsset: undefined,
  };

  // Accumulator for resolved asset over the run
  const assetAcc: Partial<TokenContract | WalletAccount> = {};
  let seeded = false;

  const mergeAssetPatch = (patch?: Partial<TokenContract | WalletAccount>) => {
    if (!patch) return;
    const incAddr = (patch as any)?.address?.toString?.().toLowerCase?.();
       const curAddr = (assetAcc as any)?.address?.toString?.().toLowerCase?.();

    if (!curAddr && (patch as any)?.address) {
      (assetAcc as any).address = (patch as any).address;
    }

    const canMerge = !incAddr || !curAddr || incAddr === curAddr;
    if (!canMerge) return;

    for (const [k, v] of Object.entries(patch)) {
      const key = k as keyof typeof patch;
      const curr = (assetAcc as any)[key];
      if (curr === undefined || curr === null) {
        (assetAcc as any)[key] = v;
      }
    }
  };

  const MAX_STEPS = 50;
  let steps = 0;

  while (true) {
    if (steps++ > MAX_STEPS) {
      console.warn('⚠️ FSM aborted due to step limit. Possible loop.');
      break;
    }

    current.inputState = fSMState;

    // Only run core transitions for trigger states
    if (!isTriggerFSMState(fSMState)) break;

    // Provide latest accumulator snapshot to validators
    current.resolvedAsset = assetAcc;

    const result: ValidateFSMOutput = await validateFSMCore(current);
    const next = result.nextState;

    // Seed accumulator once we leave VALIDATE_ADDRESS the first time
    if (!seeded && fSMState === InputState.VALIDATE_ADDRESS && next !== InputState.VALIDATE_ADDRESS) {
      (assetAcc as any).address = debouncedHexInput as any as Address;
      (assetAcc as any).chainId = chainId as any;
      seeded = true;
    }

    // Merge patches from this step
    if ((result as any).assetPatch) mergeAssetPatch((result as any).assetPatch);
    if ((result as any).validatedAsset) mergeAssetPatch((result as any).validatedAsset);

    if (next === fSMState) break; // Terminal or no-op

    console.log(
      `🟢 ${getStateIcon(fSMState)} ${InputState[fSMState]} → ${getStateIcon(next)} ${InputState[next]} (FSM)`
    );

    fSMState = next;
    runTrace.push(fSMState);
  }

  const finalState: InputState = runTrace.at(-1) ?? InputState.VALIDATE_ADDRESS;

  // Persist pretty trace
  if (prevLast !== finalState) appendLines(SEP_LINE);
  appendLines(headerLine(containerType, debouncedHexInput, feedType));
  appendLines(formatTrace(runTrace));
  setTrace([...prevTrace, ...runTrace]);

  debug.log(`🏁 finalState → ${InputState[finalState]}`);

  // Return asset for preview and commit states (centralized commit in hook)
  const isCommit =
    finalState === InputState.UPDATE_VALIDATED_ASSET ||
    finalState === InputState.CLOSE_SELECT_PANEL;
  const isPreview = finalState === InputState.VALIDATE_PREVIEW;
  const hasAddr = Boolean((assetAcc as any).address);

  const result =
    (hasAddr && (isPreview || isCommit))
      ? ({ finalState, asset: assetAcc as WalletAccount | TokenContract })
      : ({ finalState });

  return result;
}
