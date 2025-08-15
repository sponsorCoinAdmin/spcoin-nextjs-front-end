// File: lib/hooks/inputValidations/FSM_Core/validationTests/updateValidated.ts

import { InputState } from '@/lib/structure/assetSelection';
import type { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

/**
 * UPDATE_VALIDATED_ASSET
 * - Commit the validated asset/token to the app (moved from context side-effects).
 * - Then advance to CLOSE_SELECT_PANEL.
 *
 * Notes:
 * - This reads optional callbacks from `ValidateFSMInput`:
 *   - setValidatedAsset?: (asset: any) => void
 *   - setTradingTokenCallback?: (token: any) => void
 * - The exact token/asset shape differs across callers, so we defensively probe common fields.
 */
export function updateValidated(input: ValidateFSMInput): ValidateFSMOutput {
  try {
    // Pull the asset/token from the most likely places without being rigid to caller shape.
    const candidateAsset =
      input?.validatedAsset ??
      undefined;

    const candidateToken =
      input?.validatedToken ??
      candidateAsset?.token ??
      input?.resolvedToken ??
      undefined;

    // Side-effects moved from context:
    alert(`updateValidated(candidateAsset:${stringifyBigInt(candidateAsset)}\ncandidateToken: updateValidated(${stringifyBigInt(candidateToken)})`);
    input?.setValidatedAsset?.(candidateAsset);
    input?.setTradingTokenCallback?.(candidateToken);

    const out: ValidateFSMOutput = {
      nextState: InputState.CLOSE_SELECT_PANEL,
      // Preserve visibility in logs/trace where supported by the output type.
      validatedToken: candidateToken,
    };

    return out;
  } catch (err: any) {
    return {
      nextState: InputState.VALIDATE_ADDRESS,
      errorMessage: err?.message ?? 'updateValidated() failed',
    };
  }
}
