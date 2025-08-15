// File: lib/hooks/inputValidations/helpers/fsmRunner.ts
'use client';

import {
  SP_COIN_DISPLAY,
  FEED_TYPE,
  WalletAccount,
  TokenContract,
} from '@/lib/structure';
import { validateFSMCore } from '../FSM_Core/validateFSMCore';import type {
  ValidateFSMInput,
  ValidateFSMOutput,
} from '../FSM_Core/types/validateFSMTypes';
import { Address, zeroAddress } from 'viem';
import { formatTrace, headerLine, SEP_LINE } from './fsmFormat';
import { getPrevTrace, setTrace, appendLines } from './fsmStorage';
import { getStateIcon } from './fsmTraceUtils';
import { InputState } from '@/lib/structure/assetSelection';
import { isTriggerFSMState } from '../FSM_Core/fSMInputStates';

export type FSMRunnerParams = {
  debouncedHexInput: string;
  containerType: SP_COIN_DISPLAY;
  publicClient: any;
  chainId: number;
  accountAddress?: string;

  /** Opposite side’s committed address (BUY panel gets SELL’s, SELL panel gets BUY’s) */
  peerAddress?: string;

  /** Whether current input was typed manually (true) vs chosen from list (false) */
  manualEntry?: boolean;

  // Side-effect callbacks (executed inside FSM validators)
  setValidatedAsset: (asset: WalletAccount | TokenContract | undefined) => void;
  closePanelCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (token: any) => void;

  // From useHexInput (forwarded to FSM core)
  isValid: boolean;
  failedHexInput?: string;
};

export async function runFSM(params: FSMRunnerParams) {
  const {
    debouncedHexInput,
    containerType,
    publicClient,
    chainId,
    accountAddress,
    isValid,
    failedHexInput,

    // pass-through side-effect handlers for core to call
    setValidatedAsset,
    setTradingTokenCallback,
    closePanelCallback,

    // duplicate detection + entry mode
    peerAddress,
    manualEntry,
  } = params;

  // 🔒 Token-only runner: feed type is the literal FEED_TYPE.TOKEN_LIST
  const FEED: FEED_TYPE.TOKEN_LIST = FEED_TYPE.TOKEN_LIST;

  const prevTrace = getPrevTrace();
  const prevLast: InputState | undefined = prevTrace.at(-1);

  // ——— Normal FSM run ———
  const runTrace: InputState[] = [];
  let fSMState: InputState = InputState.VALIDATE_ADDRESS;
  runTrace.push(fSMState);

  // Single mutable input object passed through all steps.
  // validateFSMCore() and its validators may enrich this object between steps.
  const current: ValidateFSMInput = {
    inputState: fSMState,
    debouncedHexInput,

    // forwarded from hook
    isValid,
    failedHexInput,

    // environment / routing
    containerType,
    feedType: FEED,
    chainId,
    publicClient,
    accountAddress: (accountAddress ?? zeroAddress) as Address,

    // selection semantics & duplicate detection
    manualEntry: manualEntry ?? true,
    peerAddress,

    // side-effect callbacks (executed by FSM validation tests)
    setValidatedAsset,
    setTradingTokenCallback,
    closePanelCallback,

    // utilities/tests may use this
    seenBrokenLogos: new Set<string>(),

    // NEW: let validators see what we’ve accumulated so far
    resolvedAsset: undefined,
  };

  // NEW: single accumulator for the entire run
  const assetAcc: Partial<TokenContract> = {};
  let seeded = false;

  // Merge policy: same-address only; “fill gaps” only (don’t overwrite defined fields)
  const mergeAssetPatch = (patch?: Partial<TokenContract>) => {
    if (!patch) return;

    const incAddr = (patch.address as any)?.toLowerCase?.();
    const curAddr = (assetAcc.address as any)?.toLowerCase?.();

    // First write wins: set address if we don’t have one yet
    if (!curAddr && patch.address) {
      assetAcc.address = patch.address;
    }

    // Only merge if address matches (or no incoming address)
    const canMerge = !incAddr || !curAddr || incAddr === curAddr;
    if (!canMerge) return;

    for (const [k, v] of Object.entries(patch)) {
      const key = k as keyof TokenContract;
      const curr = assetAcc[key];
      if (curr === undefined || curr === null) {
        (assetAcc as any)[key] = v;
      }
    }
  };

  // Safety guard to avoid infinite loops in case of a bug
  const MAX_STEPS = 50;
  let steps = 0;

  while (true) {
    if (steps++ > MAX_STEPS) {
      console.warn('⚠️ FSM runner aborted due to step limit. Possible loop.');
      break;
    }

    current.inputState = fSMState;

    // Only core-process trigger states; preview/terminal states are handled by UI
    if (!isTriggerFSMState(fSMState)) break;

    // Always pass the latest snapshot to validators
    current.resolvedAsset = assetAcc;

    const result: ValidateFSMOutput = await validateFSMCore(current);
    const next = result.nextState;

    // Seed the accumulator right AFTER we leave VALIDATE_ADDRESS (address considered valid)
    if (!seeded && fSMState === InputState.VALIDATE_ADDRESS && next !== InputState.VALIDATE_ADDRESS) {
      assetAcc.address = (debouncedHexInput as any) as Address;
      (assetAcc as any).chainId = chainId;
      seeded = true;
    }

    // Merge output patch from this step
    if (result.assetPatch) mergeAssetPatch(result.assetPatch as Partial<TokenContract>);

    if (next === fSMState) {
      // Terminal or no-op; stop the loop
      break;
    }

    // Pretty console transition: ICON + NAME
    console.log(
      `🟢 ${getStateIcon(fSMState)} ${InputState[fSMState]} → ${getStateIcon(next)} ${InputState[next]} (FSM Runner)`
    );

    fSMState = next;
    runTrace.push(fSMState);
  }

  const finalState: InputState = runTrace.at(-1) ?? InputState.VALIDATE_ADDRESS;

  // Commit once at the end if we have an address (stable asset snapshot)
  if (
    assetAcc.address &&
    (finalState === InputState.UPDATE_VALIDATED_ASSET ||
      finalState === InputState.CLOSE_SELECT_PANEL)
  ) {
    try {
      params.setValidatedAsset(assetAcc as TokenContract);
    } catch (e) {
      console.warn('⚠️ setValidatedAsset failed in runner:', e);
    }
  }

  // Divider rule: add SEP if previous final state != current final state
  if (prevLast !== finalState) {
    appendLines(SEP_LINE);
  }

  // Header + transitions for this run
  appendLines(headerLine(containerType, debouncedHexInput, FEED));
  appendLines(formatTrace(runTrace));

  // Persist raw trace: prev + this run
  setTrace([...prevTrace, ...runTrace]);
}
