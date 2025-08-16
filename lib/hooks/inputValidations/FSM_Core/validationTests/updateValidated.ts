// File: lib/hooks/inputValidations/FSM_Core/validationTests/updateValidated.ts

import { InputState } from '@/lib/structure/assetSelection';
import type { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

/**
 * UPDATE_VALIDATED_ASSET
 * - Commit the validated asset to the app (via optional callback).
 * - Then advance to CLOSE_SELECT_PANEL.
 *
 * Notes:
 * - Expects the runner/validators to populate `validatedAsset` (or `resolvedAsset` as a fallback).
 * - Intentionally asset-only: no references to “token” here.
 * - Debug `alert` is intentionally kept.
 */
export function updateValidated(input: ValidateFSMInput): ValidateFSMOutput {
  try {
    const finalAsset =
      input.validatedAsset ??
      input.resolvedAsset ??
      undefined;

    // 🔔 Debug alert (kept intentionally)
    // alert(
    //   `updateValidated(finalAsset: ${stringifyBigInt(finalAsset)})`
    // );

    // Optional side-effect
    input.setValidatedAsset?.(finalAsset as any);

    return { nextState: InputState.CLOSE_SELECT_PANEL };
  } catch (err: any) {
    return {
      nextState: InputState.VALIDATE_ADDRESS,
      errorMessage: err?.message ?? 'updateValidated() failed',
    };
  }
}
