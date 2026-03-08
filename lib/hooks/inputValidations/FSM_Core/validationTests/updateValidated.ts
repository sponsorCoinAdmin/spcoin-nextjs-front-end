// File: lib/hooks/inputValidations/FSM_Core/validationTests/updateValidated.ts
import { InputState } from '@/lib/structure/assetSelection';
import type {
  ValidateFSMInput,
  ValidateFSMOutput,
} from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_FSM === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_FSM_UPDATE_VALIDATED === 'true';

const debugLog = createDebugLogger('updateValidated', DEBUG_ENABLED, LOG_TIME);

/**
 * RETURN_VALIDATED_ASSET
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

    // Pull some context (best-effort; shape depends on caller)
    const instanceId    = (input as any)?.instanceId ?? '—';
    const containerType = (input as any)?.containerType ?? '—';
    const feedType      = (input as any)?.feedType ?? '—';

    // ——— Debug: summarize what we're about to commit ———
    const addr     = (finalAsset as any)?.address ?? '—';
    const sym      = (finalAsset as any)?.symbol ?? '—';
    const nm       = (finalAsset as any)?.name ?? '—';
    const chainId  = (finalAsset as any)?.chainId ?? '—';
    const decimals = (finalAsset as any)?.decimals ?? '—';

    debugLog.log?.(
      '✅ Committing validated asset (SUMMARY):',
      {
        instanceId,
        containerType,
        feedType,
        hasValidatedAsset: !!input.validatedAsset,
        hasResolvedAsset: !!input.resolvedAsset,
        address: addr,
        symbol: sym,
        name: nm,
        chainId,
        decimals,
      },
    );

    if (!finalAsset) {
      debugLog.warn?.(
        '⚠️ finalAsset is undefined; setValidatedAsset will receive undefined. ' +
          'Check upstream validators / resolvers.',
      );
    }

    // Full payload dump for deep debugging (useful on EC2 vs localhost)
    debugLog.log?.('📦 updateValidated payload (FULL):', {
      instanceId,
      containerType,
      feedType,
      validatedAsset: input.validatedAsset,
      resolvedAsset: input.resolvedAsset,
      finalAsset,
    });

    // 🔔 Optional manual alert (kept for on-demand validation while testing)
    // if (process.env.NEXT_PUBLIC_FSM_ALERT_COMMIT === 'true') {
    //   alert(`updateValidated(finalAsset): ${stringifyBigInt(finalAsset)}`);
    // }

    if (!input.setValidatedAsset) {
      debugLog.warn?.(
        'ℹ️ setValidatedAsset callback not provided; skipping side-effect.',
      );
    } else {
      input.setValidatedAsset(finalAsset as any);
      debugLog.log?.('📬 setValidatedAsset() dispatched.');
    }

    debugLog.log?.(
      `➡️ Next state: ${InputState[InputState.CLOSE_SELECT_PANEL]}`,
    );
    return { nextState: InputState.CLOSE_SELECT_PANEL };
  } catch (err: any) {
    debugLog.error?.(`❌ updateValidated failed: ${err?.message ?? err}`);
    return {
      nextState: InputState.VALIDATE_ADDRESS,
      errorMessage: err?.message ?? 'updateValidated() failed',
    };
  }
}
