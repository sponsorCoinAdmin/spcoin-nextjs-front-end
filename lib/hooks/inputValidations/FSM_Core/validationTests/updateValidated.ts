// File: lib/hooks/inputValidations/FSM_Core/validationTests/updateValidated.ts

import { InputState } from '@/lib/structure';
import type { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

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
      (input as any)?.validatedAsset ??
      (input as any)?.resolvedAsset ??
      (input as any)?.previewAsset ??
      undefined;

    const candidateToken =
      (input as any)?.validatedToken ??
      candidateAsset?.token ??
      (input as any)?.resolvedToken ??
      undefined;

    // Side-effects moved from context:
    (input as any)?.setValidatedAsset?.(candidateAsset);
    (input as any)?.setTradingTokenCallback?.(candidateToken);

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
