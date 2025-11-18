// File: lib/hooks/inputValidations/tests/validateResolvedAsset.ts

import type { Address } from 'viem';
import { FEED_TYPE } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';
import { resolveContract } from '@/lib/utils/publicERC20/resolveContract';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import type { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { getLogoURL } from'@/lib/network/utils';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
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

    // Resolve contract core fields (symbol, name, decimals, etc.)
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

    // Ensure logoURL is populated (belt & suspenders)
    let logoURL = (resolved as any).logoURL as string | undefined;

    if (!logoURL && resolved.address) {
      try {
        logoURL = await getLogoURL(input.chainId, resolved.address as Address, input.feedType);
        debugLog.log('🖼️ Resolved logoURL via getLogoURL', {
          chainId: input.chainId,
          address: resolved.address,
          logoURL,
        });
      } catch (e) {
        logoURL = defaultMissingImage;
        debugLog.warn('⚠️ getLogoURL failed; using defaultMissingImage', {
          chainId: input.chainId,
          address: resolved.address,
          error: e,
        });
      }
    }

    const patched = {
      ...resolved,
      logoURL: logoURL || defaultMissingImage, // ✅ guarantee presence
    };

    const nextState = manualEntry
      ? InputState.VALIDATE_PREVIEW
      : InputState.UPDATE_VALIDATED_ASSET;

    const result: ValidateFSMOutput = {
      nextState,
      assetPatch: patched, // <-- the runner merges this into resolvedAsset
    };

    debugLog.log(`🎯 validateResolvedAsset success → ${InputState[nextState]}`, {
      address: patched.address,
      symbol: (patched as any).symbol,
      name:   (patched as any).name,
      decimals: (patched as any).decimals,
      logoURL: (patched as any).logoURL,
    });

    return result;
  } catch (err) {
    debugLog.error('❌ Exception during resolveContract', err);
    return { nextState: InputState.RESOLVE_ASSET_ERROR };
  }
}
