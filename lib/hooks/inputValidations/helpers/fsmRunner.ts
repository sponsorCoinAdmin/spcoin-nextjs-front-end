// File: lib/hooks/inputValidations/helpers/fsmRunner.ts
'use client';

import {
  InputState,
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

  // ——— Normal FSM run (no pre-short-circuiting here) ———
  const runTrace: InputState[] = [];
  let fSMState: InputState = InputState.VALIDATE_ADDRESS;
  runTrace.push(fSMState);

  // 🔔 STOP-POINT (1): show what arrived to the runner
  // alert(
  //   `[fsmRunner] ENTER\n` +
  //   `params.manualEntry=${String(manualEntry)}\n` +
  //   `params.peerAddress=${peerAddress ?? '(none)'}\n` +
  //   `debouncedHexInput=${debouncedHexInput || '(empty)'}`
  // );

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
    manualEntry: manualEntry ?? true, // default to true if absent
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
  };

  // 🔔 STOP-POINT (2): confirm what will be given to validateFSMCore on first call
  // alert(
  //   `[fsmRunner] INITIAL INPUT OBJECT\n` +
  //   `current.manualEntry=${String((current as any).manualEntry)}\n` +
  //   `current.peerAddress=${(current as any).peerAddress ?? '(none)'}\n` +
  //   `state=${InputState[current.inputState]}`
  // );

  // Safety guard to avoid infinite loops in case of a bug
  const MAX_STEPS = 50;
  let steps = 0;

  while (true) {
    if (steps++ > MAX_STEPS) {
      console.warn('⚠️ FSM runner aborted due to step limit. Possible loop.');
      break;
    }

    current.inputState = fSMState;

    // 🔔 STOP-POINT (3): pre-call per-step snapshot
    // alert(
    //   `[fsmRunner] STEP ${steps} PRE-CALL\n` +
    //   `state=${InputState[fSMState]}\n` +
    //   `manualEntry=${String((current as any).manualEntry)}\n` +
    //   `peerAddress=${(current as any).peerAddress ?? '(none)'}`
    // );

    const result: ValidateFSMOutput = await validateFSMCore(current);

    // 🔔 STOP-POINT (4): after-call result snapshot
    // alert(
    //   `[fsmRunner] STEP ${steps} POST-CALL\n` +
    //   `from=${InputState[fSMState]} → to=${InputState[result.nextState]}\n` +
    //   `manualEntry(still)=${String((current as any).manualEntry)}`
    // );

    const next = result.nextState;

    // 🔁 Merge outputs → inputs so the next state can see them
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
