// File: lib/hooks/inputValidations/tests/validateResolvedAsset.ts

import { Address } from 'viem';
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
 *
 * IMPORTANT: Always return `assetPatch` so the runner merges into `resolvedAsset`.
 * `updateValidated` will then use `resolvedAsset` to commit.
 */
export async function validateResolvedAsset(
  input: ValidateFSMInput
): Promise<ValidateFSMOutput> {
  const manualEntry: boolean = input?.manualEntry ?? true;

  if (input.feedType !== FEED_TYPE.TOKEN_LIST) {
    debugLog.warn('❌ Non-token asset validation not supported — resolving to RESOLVE_ASSET_ERROR');
    return {
      nextState: InputState.RESOLVE_ASSET_ERROR,
      errorMessage: 'Non-token asset validation not supported',
    };
  }

  try {
    const addr = input.debouncedHexInput as Address;
    const resolved = await resolveContract(
      addr,
      input.chainId,
      input.publicClient,
      (input.accountAddress as Address | undefined)
    );

    if (!resolved) {
      debugLog.warn('❌ Failed to resolve asset — resolving to TOKEN_NOT_RESOLVED_ERROR');
      return { nextState: InputState.TOKEN_NOT_RESOLVED_ERROR };
    }

    const nextState = manualEntry
      ? InputState.VALIDATE_PREVIEW
      : InputState.UPDATE_VALIDATED_ASSET;

    const result: ValidateFSMOutput = {
      nextState,
      assetPatch: resolved, // <-- the runner merges this into resolvedAsset
    };

    debugLog.log(
      `🎯 validateResolvedAsset success → ${InputState[nextState]}`,
      {
        address: resolved.address,
        symbol: (resolved as any).symbol,
        name:   (resolved as any).name,
        decimals: (resolved as any).decimals,
      }
    );

    return result;
  } catch (err) {
    debugLog.error('❌ Exception during resolveContract', err);
    return { nextState: InputState.RESOLVE_ASSET_ERROR };
  }
}
