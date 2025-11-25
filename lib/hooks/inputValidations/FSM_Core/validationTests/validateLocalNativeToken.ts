// File: lib/hooks/inputValidations/tests/validateLocalNativeToken.ts

import type { Address } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';
import { FEED_TYPE } from '@/lib/structure';
import {
  getInfoURL,
} from '@/lib/context/helpers/assetHelpers';
import { get } from '@/lib/rest/http';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure/constants/addresses';
import type {
  ValidateFSMInput,
  ValidateFSMOutput,
} from '../types/validateFSMTypes';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger(
  'validateLocalNativeToken',
  DEBUG_ENABLED,
  LOG_TIME,
);

/**
 * Local-existence check before we hit the chain.
 *
 * For *native* tokens (0xEeee... sentinel), we:
 *   - Look for `/assets/blockchains/<chainId>/contracts/<ADDR>/info.json`
 *   - If found and JSON is valid with `name` / `symbol` (and optionally `decimals`),
 *     we return an `assetPatch` so the FSM can enrich the resolvedAsset.
 *
 * Regardless of outcome we still proceed to `VALIDATE_EXISTS_ON_CHAIN`
 * so that the on-chain / native-short-circuit logic can run as before.
 */
export async function validateLocalNativeToken(
  input: ValidateFSMInput,
): Promise<ValidateFSMOutput> {
  const { debouncedHexInput, chainId, feedType } = input;

  debugLog.log(`validateLocalNativeToken(${debouncedHexInput})`);

  const addr = (debouncedHexInput ?? '').trim();
  
  // Treat feedType defensively; default to TOKEN_LIST if missing.
  const effectiveFeedType = feedType ?? FEED_TYPE.TOKEN_LIST;

  // Detect native token by sentinel address (case-insensitive).
  const isNative =
    typeof NATIVE_TOKEN_ADDRESS === 'string' &&
    addr.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

  if (!isNative) {
    // Non-native: keep existing behaviour (just advance to on-chain validation).
    return { nextState: InputState.VALIDATE_EXISTS_ON_CHAIN };
  }

  // Native token path: try to hydrate from local info.json
  try {
    const infoURL = await getInfoURL(
      chainId,
      addr as Address,
      effectiveFeedType,
    );

    if (!infoURL) {
      debugLog.warn(
        'No infoURL for native asset; continuing to VALIDATE_EXISTS_ON_CHAIN',
        { addr, chainId, feedType: effectiveFeedType },
      );
      return { nextState: InputState.VALIDATE_ERC20_ASSET_ERROR};
    }

    const res = await get(infoURL, {
      timeoutMs: 2500,
      retries: 0,
      init: { cache: 'no-store' },
    });

    if (!res.ok) {
      debugLog.warn('Failed to fetch native info.json; continuing', {
        addr,
        chainId,
        feedType: effectiveFeedType,
        status: res.status,
      });
      return { nextState: InputState.VALIDATE_ERC20_ASSET_ERROR };
    }

    const info = await res.json();

    const symbol = info?.symbol as string | undefined;
    const name = info?.name as string | undefined;
    const decimals = info?.decimals as number | undefined;
    const type = (info?.type as string | undefined) ?? 'native';

    const assetPatch: Record<string, unknown> = {};

    if (symbol) assetPatch.symbol = symbol;
    if (name) assetPatch.name = name;
    if (typeof decimals === 'number') assetPatch.decimals = decimals;
    assetPatch.type = type;
    assetPatch.infoURL = infoURL;

    // If we didn't actually learn anything, just fall through.
    if (Object.keys(assetPatch).length === 0) {
      debugLog.log(
        'Native info.json contained no usable metadata; continuing unchanged',
        { addr, chainId },
      );
      return { nextState: InputState.VALIDATE_ERC20_ASSET_ERROR };
    }

    debugLog.log('✅ Native asset hydrated from info.json', {
      addr,
      chainId,
      symbol,
      name,
      decimals,
      infoURL,
    });

    return {
      nextState: InputState.RETURN_VALIDATED_ASSET,
      assetPatch,
    };
  } catch (error) {
    debugLog.error('❌ Exception while loading native info.json', {
      addr,
      chainId,
      error,
    });

    // On any failure, keep the pipeline moving as before.
    return { nextState: InputState.VALIDATE_ERC20_ASSET_ERROR };
  }
}
