// File: lib/hooks/inputValidations/helpers/fsmRunner.ts
'use client';

import {
  SP_COIN_DISPLAY,
  FEED_TYPE,
  WalletAccount,
  TokenContract,
} from '@/lib/structure';
import { validateFSMCore } from '../FSM_Core/validateFSMCore';
import type {
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
  feedType: FEED_TYPE;
  publicClient: any;
  chainId: number;
  accountAddress?: string;

  /** Opposite side’s committed address (BUY panel gets SELL’s, SELL panel gets BUY’s) */
  peerAddress?: string;

  /** Whether current input was typed manually (true) vs chosen from list (false) */
  manualEntry?: boolean;

  // Side-effect callbacks (executed inside FSM core tests)
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
    feedType,
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

  const prevTrace = getPrevTrace();
  const prevLast: InputState | undefined = prevTrace.at(-1);

  // ——— Normal FSM run ———
  const runTrace: InputState[] = [];
  let fSMState: InputState = InputState.VALIDATE_ADDRESS;
  runTrace.push(fSMState);

  // Single mutable input object passed through all steps.
  // validateFSMCore() and its nested tests may enrich this object between steps.
  const current: ValidateFSMInput = {
    inputState: fSMState,
    debouncedHexInput,

    // forwarded from hook
    isValid,
    failedHexInput,

    // environment / routing
    containerType,
    feedType,
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

    // placeholders that tests may populate during progression
    validatedToken: undefined,
    validatedWallet: undefined,

    // utilities/tests may use this
    seenBrokenLogos: new Set<string>(),

    // NEW: let validators see what we’ve accumulated so far
    resolvedToken: undefined,
  };

  // NEW: single accumulator for the entire run
  const tokenAcc: Partial<TokenContract> = {};
  let seeded = false;

  // Merge policy: same-address only; “fill gaps” only (don’t overwrite defined fields)
  const mergeTokenPatch = (patch?: Partial<TokenContract>) => {
    if (!patch) return;

    const incAddr = (patch.address as any)?.toLowerCase?.();
    const curAddr = (tokenAcc.address as any)?.toLowerCase?.();

    // First write wins: set address if we don’t have one yet
    if (!curAddr && patch.address) {
      tokenAcc.address = patch.address;
    }

    // Only merge if address matches (or no incoming address)
    const canMerge = !incAddr || !curAddr || incAddr === curAddr;
    if (!canMerge) return;

    for (const [k, v] of Object.entries(patch)) {
      const key = k as keyof TokenContract;
      const curr = tokenAcc[key];
      if (curr === undefined || curr === null) {
        (tokenAcc as any)[key] = v;
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
    if (!isTriggerFSMState(fSMState)) break; // only core calls on FSM trigger states
    current.resolvedToken = tokenAcc; // always pass the latest snapshot

    const result: ValidateFSMOutput = await validateFSMCore(current);
    const next = result.nextState;

    // Seed the accumulator right AFTER we leave VALIDATE_ADDRESS (address considered valid)
    if (!seeded && fSMState === InputState.VALIDATE_ADDRESS && next !== InputState.VALIDATE_ADDRESS) {
      tokenAcc.address = (debouncedHexInput as any) as Address;
      tokenAcc.chainId = chainId as any;
      seeded = true;
    }

    // Merge outputs from this step
    const tokenPatch = (result as any).tokenPatch as Partial<TokenContract> | undefined;
    if (tokenPatch) mergeTokenPatch(tokenPatch);
    if (result.validatedToken) mergeTokenPatch(result.validatedToken as Partial<TokenContract>);

    // Also surface legacy fields if any validator still sets them
    if (result.validatedToken !== undefined) {
      (current as any).validatedToken = result.validatedToken;
    }
    if (result.validatedAsset !== undefined) {
      (current as any).validatedAsset = result.validatedAsset;
    }

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

  // Commit once at the end if we have an address (stable token snapshot)
  if (
    tokenAcc.address &&
    (finalState === InputState.UPDATE_VALIDATED_ASSET ||
      finalState === InputState.CLOSE_SELECT_PANEL)
  ) {
    try {
      params.setValidatedAsset(tokenAcc as TokenContract);
    } catch (e) {
      console.warn('⚠️ setValidatedAsset failed in runner:', e);
    }
  }

  // Divider rule: add SEP if previous final state != current final state
  if (prevLast !== finalState) {
    appendLines(SEP_LINE);
  }

  // Header + transitions for this run
  appendLines(headerLine(containerType, debouncedHexInput, feedType));
  appendLines(formatTrace(runTrace));

  // Persist raw trace: prev + this run
  setTrace([...prevTrace, ...runTrace]);
}
