// File: lib/hooks/inputValidations/helpers/fsmRunner.ts
'use client';

import {
  InputState,
  SP_COIN_DISPLAY,
  FEED_TYPE,
  WalletAccount,
} from '@/lib/structure';
import { validateFSMCore } from '../FSM_Core/validateFSMCore';
import type { ValidateFSMInput, ValidateFSMOutput } from '../FSM_Core/types/validateFSMTypes';
import { Address } from 'viem';

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

  setValidatedAsset: (asset: WalletAccount | undefined) => void;
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
  } = params;

  const prevTrace = getPrevTrace();
  const prevLast: InputState | undefined = prevTrace.at(-1);

  // ——— Normal FSM run (no pre-short-circuiting here) ———
  const runTrace: InputState[] = [];
  let fSMState: InputState = InputState.VALIDATE_ADDRESS;
  runTrace.push(fSMState);

  const current: ValidateFSMInput = {
    inputState: fSMState,
    debouncedHexInput,
    isValid,                // 👈 forwarded from hook
    failedHexInput,         // 👈 forwarded from hook
    seenBrokenLogos: new Set(),
    containerType,
    feedType,
    chainId,
    publicClient,
    accountAddress: accountAddress as Address,
    manualEntry: true,
    sellAddress: feedType === FEED_TYPE.TOKEN_LIST ? debouncedHexInput : undefined,
    buyAddress: undefined,
    validatedToken: undefined,
    validatedWallet: undefined,
  };

  while (true) {
    current.inputState = fSMState;
    const result: ValidateFSMOutput = await validateFSMCore(current);
    const next = result.nextState;
    if (next === fSMState) break;

    console.log(`🟢 ${getStateIcon(fSMState)} ${fSMState} → ${getStateIcon(next)} ${next} (FSM Runner)`);
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

  // (Header/history JSON writing stays wherever you already handle it, if applicable.)
}
