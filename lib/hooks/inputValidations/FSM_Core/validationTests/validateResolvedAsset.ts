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
 * After chain existence check, resolve full token metadata.
 * On success:
 *   - if manualEntry === true  → VALIDATE_PREVIEW (show preview card)
 *   - if manualEntry === false → UPDATE_VALIDATED_ASSET (skip preview; auto-commit)
 */
export async function validateResolvedAsset(input: ValidateFSMInput): Promise<ValidateFSMOutput> {
  // Manual-entry toggle now lives here (defaults to true if absent)
  const manualEntry: boolean = (input as any)?.manualEntry ?? true;

  if (input.feedType === FEED_TYPE.TOKEN_LIST) {
    try {
      const validatedToken = await resolveContract(
        input.debouncedHexInput as `0x${string}`,
        input.chainId,
        input.publicClient,
        input.accountAddress
      );

      if (validatedToken) {
        const nextState = manualEntry
          ? InputState.VALIDATE_PREVIEW
          : InputState.UPDATE_VALIDATED_ASSET;

        const result: ValidateFSMOutput = {
          nextState,
          validatedToken,
        };
        debugLog.log(
          `🎯 validateResolvedAsset success → ${manualEntry ? 'VALIDATE_PREVIEW' : 'UPDATE_VALIDATED_ASSET'}`,
          { address: validatedToken.address }
        );
        return result;
      } else {
        debugLog.warn('❌ Failed to validate token — resolving to TOKEN_NOT_RESOLVED_ERROR');
        return { nextState: InputState.TOKEN_NOT_RESOLVED_ERROR };
      }
    } catch (err) {
      debugLog.error('❌ Exception during resolveContract', err);
      return { nextState: InputState.RESOLVE_ASSET_ERROR };
    }
  }

  // Wallet validation path is no longer supported
  debugLog.warn('❌ Wallet validation not supported — resolving to RESOLVE_ASSET_ERROR');
  return {
    nextState: InputState.RESOLVE_ASSET_ERROR,
    errorMessage: 'Wallet validation not supported',
  };
}
