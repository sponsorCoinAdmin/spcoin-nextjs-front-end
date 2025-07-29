// File: lib/hooks/inputValidations/tests/validateTokenAsset.ts

import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { InputState } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateTokenAsset', DEBUG_ENABLED, LOG_TIME);

/**
 * Final step token validation:
 * Ensures resolved token has necessary metadata (symbol, decimals).
 */
export async function validateTokenAsset(input: ValidateFSMInput): Promise<ValidateFSMOutput> {
  const { validatedToken } = input;

  const msg = `validateTokenAsset → ${stringifyBigInt(validatedToken)}`;
  debugLog.log(`🧪 ${msg}`);

  if (!validatedToken) {
    debugLog.warn('❌ Token not resolved');
    return { nextState: InputState.TOKEN_NOT_RESOLVED_ERROR };
  }

  if (validatedToken.decimals == null || validatedToken.symbol == null) {
    debugLog.warn('❌ Token missing decimals or symbol');
    return { nextState: InputState.RESOLVE_ASSET_ERROR };
  }

  debugLog.log(`✅ Token validated → ${validatedToken.symbol}`);
  return {
    nextState: InputState.UPDATE_VALIDATED_ASSET,
    validatedToken,
  };
}
