// File: lib/hooks/inputValidations/helpers/runner.ts
'use client';

import { InputState } from '@/lib/structure/assetSelection';
import type {
  ValidateFSMInput,
  ValidateFSMOutput,
} from '../../FSM_Core/types/validateFSMTypes';
import type { WalletAccount, TokenContract } from '@/lib/structure';
import type { Address } from 'viem';

type RunFSMArgs = {
  initialState: InputState;
  current: ValidateFSMInput;
  maxSteps?: number;
  isTriggerFSMState: (s: InputState) => boolean;
  validateFSMCore: (input: ValidateFSMInput) => Promise<ValidateFSMOutput>;
  onTransition: (prev: InputState, next: InputState) => void;
};

export async function runFSM({
  initialState,
  current,
  maxSteps = 30,
  isTriggerFSMState,
  validateFSMCore,
  onTransition,
}: RunFSMArgs): Promise<{
  finalState: InputState;
  assetAcc: Partial<TokenContract | WalletAccount>;
  transitions: InputState[];
}> {
  let state = initialState;
  const assetAcc: Partial<TokenContract | WalletAccount> = {};
  const transitions: InputState[] = [state];
  let seeded = false;

  console.log("*** ENTERING *** RUN_FSM")

  const mergeAssetPatch = (patch?: Partial<TokenContract | WalletAccount>) => {
    if (!patch) return;
    const incAddr = (patch as any)?.address?.toString?.().toLowerCase?.();
    const curAddr = (assetAcc as any)?.address?.toString?.().toLowerCase?.();

    if (!curAddr && (patch as any)?.address) {
      (assetAcc as any).address = (patch as any).address as Address;
    }
    if (incAddr && curAddr && incAddr !== curAddr) return;

    for (const [k, v] of Object.entries(patch)) {
      if ((assetAcc as any)[k] == null) {
        (assetAcc as any)[k] = v as any;
      }
    }
  };

  for (let steps = 0; steps < maxSteps; steps++) {
    current.inputState = state;

    if (!isTriggerFSMState(state)) break;

    current.resolvedAsset = assetAcc;

    const result = await validateFSMCore(current);
    const next = result.nextState;

    if (!seeded && state === InputState.VALIDATE_ADDRESS && next !== InputState.VALIDATE_ADDRESS) {
      (assetAcc as any).address = current.debouncedHexInput as any as Address;
      (assetAcc as any).chainId = current.chainId as any;
      seeded = true;
    }

    mergeAssetPatch((result as any).assetPatch);
    mergeAssetPatch((result as any).validatedAsset);

    if (next === state) break;

    onTransition(state, next);
    state = next;
    transitions.push(state);
  }

  return { finalState: state, assetAcc, transitions };
}
