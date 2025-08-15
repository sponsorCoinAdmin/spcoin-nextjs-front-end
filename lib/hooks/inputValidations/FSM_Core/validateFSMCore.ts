// File: lib/hooks/inputValidations/FSM_Core/validateFSMCore.ts

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidateFSMInput, ValidateFSMOutput } from './types/validateFSMTypes';

import { validateAddress } from './validationTests/validateAddress';
import { validateDuplicate } from './validationTests/validateDuplicate';
import { validateExistsOnChain } from './validationTests/validateExistsOnChain';
import { validateExistsLocally } from './validationTests/validateExistsLocally';
import { validateResolvedAsset } from './validationTests/validateResolvedAsset';
import { updateValidated } from './validationTests/updateValidated';
import { closeSelectPanel } from './validationTests/closeSelectPanel';

import { InputState } from '@/lib/structure/assetSelection';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const log = createDebugLogger('validateFSMCore', DEBUG_ENABLED, false).log;

// Feature flags (true = call validator; false = jump to fallback nextState)
const F = {
  VALID_ADDRESS:  process.env.NEXT_PUBLIC_FSM_TEST_VALID_ADDRESS === 'true',
  DUPLICATE:      process.env.NEXT_PUBLIC_FSM_TEST_DUPLICATE_INPUT === 'true',
  EXISTS_LOCALLY: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_LOCALLY === 'false',
  EXISTS_ONCHAIN: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_ON_CHAIN === 'false',
  RESOLVE:        process.env.NEXT_PUBLIC_FSM_TEST_RESOLVE_ASSET === 'true',
  UPDATE:         process.env.NEXT_PUBLIC_FSM_TEST_UPDATE_ASSET === 'true',
  CLOSE:          process.env.NEXT_PUBLIC_FSM_TEST_CLOSE_SELECT_PANEL === 'true',
};

type MaybePromise<T> = T | Promise<T>;

/** Merge only the fields validators are allowed to touch in the core output. */
function merge(dst: ValidateFSMOutput, src?: Partial<ValidateFSMOutput>) {
  if (!src) return;
  if (src.nextState !== undefined) dst.nextState = src.nextState;
  if (src.errorMessage !== undefined) dst.errorMessage = src.errorMessage;
  // Kept for backward-compat; runner will handle accumulation/patching.
  if (src.validatedToken !== undefined) dst.validatedToken = src.validatedToken;
}

/** Conditionally run a validator or jump to a fallback next state. */
async function step(
  out: ValidateFSMOutput,
  flag: boolean,
  run: () => MaybePromise<Partial<ValidateFSMOutput>>,
  fallback: InputState
) {
  if (flag) {
    merge(out, await run());
  } else {
    out.nextState = fallback;
  }
}

export async function validateFSMCore(input: ValidateFSMInput): Promise<ValidateFSMOutput> {
  const out: ValidateFSMOutput = {
    nextState: input.inputState,
    // Fields below are optional; the runner owns trace/accumulation.
    validatedToken: undefined,
    errorMessage: undefined,
  };

  switch (input.inputState) {
    case InputState.VALIDATE_ADDRESS:
      await step(out, F.VALID_ADDRESS, () => validateAddress(input), InputState.TEST_DUPLICATE_INPUT);
      break;

    case InputState.TEST_DUPLICATE_INPUT:
      await step(out, F.DUPLICATE, () => validateDuplicate(input), InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY);
      // Safety: ensure we always produce a next state
      if (out.nextState === undefined) {
        merge(out, {
          nextState: InputState.VALIDATE_ADDRESS,
          errorMessage: 'Missing nextState after duplicate check',
        });
      }
      break;

    case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY:
      await step(out, F.EXISTS_LOCALLY, () => validateExistsLocally(input), InputState.VALIDATE_EXISTS_ON_CHAIN);
      break;

    case InputState.VALIDATE_EXISTS_ON_CHAIN:
      await step(out, F.EXISTS_ONCHAIN, () => validateExistsOnChain(input), InputState.RESOLVE_ASSET);
      break;

    case InputState.RESOLVE_ASSET:
      await step(out, F.RESOLVE, () => validateResolvedAsset(input), InputState.UPDATE_VALIDATED_ASSET);
      break;

    case InputState.UPDATE_VALIDATED_ASSET:
      await step(out, F.UPDATE, () => updateValidated(input), InputState.CLOSE_SELECT_PANEL);
      break;

    case InputState.CLOSE_SELECT_PANEL:
      await step(out, F.CLOSE, () => closeSelectPanel(input), InputState.CLOSE_SELECT_PANEL);
      break;

    default:
      merge(out, { nextState: input.inputState, errorMessage: 'Unhandled input state' });
      break;
  }

  if (DEBUG_ENABLED) {
    log(`Core → ${InputState[input.inputState]} -> ${InputState[out.nextState]}`);
  }

  return out;
}
