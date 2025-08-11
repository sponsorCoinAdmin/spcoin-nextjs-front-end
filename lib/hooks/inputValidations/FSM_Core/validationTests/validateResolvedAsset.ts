// File: lib/hooks/inputValidations/tests/validateResolvedAsset.ts

import { FEED_TYPE, InputState } from '@/lib/structure';
import { resolveContract } from '@/lib/utils/publicERC20/resolveContract';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateResolvedAsset', DEBUG_ENABLED, LOG_TIME);

export async function validateResolvedAsset(input: ValidateFSMInput): Promise<ValidateFSMOutput> {
  // debugLog.log(`Running validateResolvedAsset(${stringifyBigInt(input)})`);
  // alert(`Running validateResolvedAsset(${stringifyBigInt(input)})`);
  if (input.feedType === FEED_TYPE.TOKEN_LIST) {
    try {
      const validatedToken = await resolveContract(
        input.debouncedHexInput as `0x${string}`,
        input.chainId,
        input.publicClient,
        input.accountAddress
      );

      if (validatedToken) {
        // debugLog.log(`🎯 VALIDATED TOKEN → ${stringifyBigInt(validatedToken)}`);
        // alert(`🎯 VALIDATED TOKEN → ${stringifyBigInt(validatedToken)}`);
        return {
          nextState: InputState.UPDATE_VALIDATED_ASSET,
          validatedToken,
        };
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
