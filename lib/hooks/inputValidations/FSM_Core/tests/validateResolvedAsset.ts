// File: lib/hooks/inputValidations/tests/validateResolvedAsset.ts

import { FEED_TYPE, InputState } from '@/lib/structure';
import { resolveContract } from '@/lib/utils/publicERC20/resolveContract';
import { validateWalletAsset } from './validateWalletAsset';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateResolvedAsset', DEBUG_ENABLED, LOG_TIME);

export async function validateResolvedAsset(input: ValidateFSMInput): Promise<ValidateFSMOutput> {
  if (input.feedType === FEED_TYPE.TOKEN_LIST) {
    try {
      const validatedToken = await resolveContract(
        input.debouncedHexInput as `0x${string}`,
        input.chainId,
        input.publicClient,
        input.accountAddress
      );

      if (validatedToken) {
        debugLog.log(`🎯 VALIDATED TOKEN → ${stringifyBigInt(validatedToken)}`);
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

  } else {
    const result = await validateWalletAsset(input);

    if (result.validatedWallet) {
      debugLog.log(`🎯 VALIDATED WALLET → ${JSON.stringify(result.validatedWallet, null, 2)}`);
      return result;
    } else {
      debugLog.warn('❌ Failed to validate wallet — resolving to RESOLVE_ASSET_ERROR');
      return { nextState: InputState.RESOLVE_ASSET_ERROR };
    }
  }
}
