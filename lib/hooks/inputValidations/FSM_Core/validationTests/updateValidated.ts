// File: @/lib/hooks/inputValidations/FSM_Core/validationTests/updateValidated.ts
import { InputState } from '@/lib/structure/assetSelection';
import type { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const debug = createDebugLogger('updateValidated', process.env.NEXT_PUBLIC_DEBUG_FSM === 'true');

/**
 * UPDATE_VALIDATED_ASSET
 * - Commit the validated asset to the app (via optional callback).
 * - Then advance to CLOSE_SELECT_PANEL.
 *
 * Notes:
 * - Expects the runner/validators to populate `validatedAsset` (or `resolvedAsset` as a fallback).
 * - Intentionally asset-only: no references to “token” here.
 * - Debug `alert` is intentionally kept (commented) for on-demand manual checks.
 */
export function updateValidated(input: ValidateFSMInput): ValidateFSMOutput {
  try {
    const finalAsset =
      input.validatedAsset ??
      input.resolvedAsset ??
      undefined;

    // ——— Debug: summarize what we're about to commit ———
    const addr = (finalAsset as any)?.address ?? '—';
    const sym  = (finalAsset as any)?.symbol ?? '—';
    const nm   = (finalAsset as any)?.name ?? '—';
    debug.log(`✅ Committing validated asset: { address: ${addr}, symbol: ${sym}, name: ${nm} }`);

    // 🔔 Optional manual alert (kept for on-demand validation while testing)
    // if (process.env.NEXT_PUBLIC_FSM_ALERT_COMMIT === 'true') {
    //   alert(`updateValidated(finalAsset): ${stringifyBigInt(finalAsset)}`);
    // }

    if (!input.setValidatedAsset) {
      debug.warn('ℹ️ setValidatedAsset callback not provided; skipping side-effect.');
    } else {
      input.setValidatedAsset(finalAsset as any);
      debug.log('📬 setValidatedAsset() dispatched.');
    }

    debug.log(`➡️ Next state: ${InputState[InputState.CLOSE_SELECT_PANEL]}`);
    return { nextState: InputState.CLOSE_SELECT_PANEL };
  } catch (err: any) {
    debug.error(`❌ updateValidated failed: ${err?.message ?? err}`);
    return {
      nextState: InputState.VALIDATE_ADDRESS,
      errorMessage: err?.message ?? 'updateValidated() failed',
    };
  }
}
