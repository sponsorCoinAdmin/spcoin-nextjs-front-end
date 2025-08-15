// File: lib/hooks/inputValidations/tests/validateResolvedAsset.ts

import { FEED_TYPE } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

import { resolveContract } from '@/lib/utils/publicERC20/resolveContract';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateResolvedAsset', DEBUG_ENABLED, LOG_TIME);

/**
 * After chain existence check, resolve full asset metadata.
 * On success:
 *   - if manualEntry === true  → VALIDATE_PREVIEW (show preview card)
 *   - if manualEntry === false → UPDATE_VALIDATED_ASSET (skip preview; auto-commit)
 */
export async function validateResolvedAsset(
  input: ValidateFSMInput
): Promise<ValidateFSMOutput> {
  // Manual-entry toggle lives here (defaults to true if absent)
  const manualEntry: boolean = input?.manualEntry ?? true;

  if (input.feedType === FEED_TYPE.TOKEN_LIST) {
    try {
      const resolved = await resolveContract(
        input.debouncedHexInput as `0x${string}`,
        input.chainId,
        input.publicClient,
        input.accountAddress
      );

      if (resolved) {
        const nextState = manualEntry
          ? InputState.VALIDATE_PREVIEW
          : InputState.UPDATE_VALIDATED_ASSET;

        // ✅ New standard: validators return patches; runner accumulates
        const result: ValidateFSMOutput = {
          nextState,
          assetPatch: resolved,
        };

        debugLog.log(
          `🎯 validateResolvedAsset success → ${manualEntry ? 'VALIDATE_PREVIEW' : 'UPDATE_VALIDATED_ASSET'}`,
          { address: resolved.address }
        );
        return result;
      } else {
        debugLog.warn('❌ Failed to resolve asset — resolving to TOKEN_NOT_RESOLVED_ERROR');
        return { nextState: InputState.TOKEN_NOT_RESOLVED_ERROR };
      }
    } catch (err) {
      debugLog.error('❌ Exception during resolveContract', err);
      return { nextState: InputState.RESOLVE_ASSET_ERROR };
    }
  }

  // Non-token asset validation is not handled here
  debugLog.warn('❌ Non-token asset validation not supported — resolving to RESOLVE_ASSET_ERROR');
  return {
    nextState: InputState.RESOLVE_ASSET_ERROR,
    errorMessage: 'Non-token asset validation not supported',
  };
}
