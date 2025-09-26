// File: lib/hooks/inputValidations/FSM_Core/validateFSMCore.ts
import { createDebugLogger } from '@/lib/utils/debugLogger';



import { InputState } from '@/lib/structure/assetSelection';
import { ValidateFSMOutput, ValidateFSMInput } from './FSM_Core/types/validateFSMTypes';
import { closeSelectPanel } from './FSM_Core/validationTests/closeSelectPanel';
import { resolveAsset } from './FSM_Core/validationTests/resolveAsset';
import { updateValidated } from './FSM_Core/validationTests/updateValidated';
import { validateAddress } from './FSM_Core/validationTests/validateAddress';
import { validateDuplicate } from './FSM_Core/validationTests/validateDuplicate';
import { validateExistsLocally } from './FSM_Core/validationTests/validateExistsLocally';
import { validateExistsOnChain } from './FSM_Core/validationTests/validateExistsOnChain';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const log = createDebugLogger('validateFSMCore', DEBUG_ENABLED, false).log;

// Feature flags (true = call validator; false = jump to fallback nextState)
const F = {
  VALID_ADDRESS:  process.env.NEXT_PUBLIC_FSM_TEST_VALID_ADDRESS === 'true',
  DUPLICATE:      process.env.NEXT_PUBLIC_FSM_TEST_DUPLICATE_INPUT === 'true',
  EXISTS_LOCALLY: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_LOCALLY === 'true',
  EXISTS_ONCHAIN: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_ON_CHAIN === 'true',
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
  if (src.assetPatch !== undefined) dst.assetPatch = src.assetPatch; // unified asset patch
  // NOTE: ValidateFSMOutput is patch-only in your types; do not copy validatedAsset/resolvedAsset here.
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
    errorMessage: undefined,
    assetPatch: undefined,
  };

  switch (input.inputState) {
    case InputState.VALIDATE_ADDRESS:
      await step(out, F.VALID_ADDRESS, () => validateAddress(input), InputState.TEST_DUPLICATE_INPUT);
      break;

    case InputState.TEST_DUPLICATE_INPUT:
      await step(out, F.DUPLICATE, () => validateDuplicate(input), InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY);
      if (out.nextState === undefined) {
        merge(out, {
          nextState: InputState.VALIDATE_ADDRESS,
          errorMessage: 'Missing nextState after duplicate check',
        });
      }
      break;

    case InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY:
      await step(out, F.EXISTS_LOCALLY, () => validateExistsLocally(input), InputState.VALIDATE_EXISTS_ON_CHAIN);
      break;

    case InputState.VALIDATE_EXISTS_ON_CHAIN:
      await step(out, F.EXISTS_ONCHAIN, () => validateExistsOnChain(input), InputState.RESOLVE_ASSET);
      break;

    case InputState.RESOLVE_ASSET:
      // 🔧 crucial: panel-aware; returns assetPatch for account-like flows
      await step(out, F.RESOLVE, () => resolveAsset(input), InputState.UPDATE_VALIDATED_ASSET);
      break;

    case InputState.UPDATE_VALIDATED_ASSET:
      // Your updateValidated should read input.assetPatch (runner merges patches across steps)
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
