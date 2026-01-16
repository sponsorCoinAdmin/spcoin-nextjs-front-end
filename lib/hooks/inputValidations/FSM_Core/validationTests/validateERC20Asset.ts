// File: @/lib/hooks/inputValidations/FSM_Core/validationTests/validateERC20Asset.ts

import { isAddress } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import type {
  ValidateFSMInput,
  ValidateFSMOutput,
} from '../types/validateFSMTypes';
import { isStudyEnabled, StudyId } from '../studyPolicy';
import { validateCreateERC20Asset } from './validateCreateERC20Asset';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure/constants/addresses';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true' ||
process.env.NEXT_PUBLIC_DEBUG_FSM_VALIDATE_ERC20_ASSET === 'true';

const debugLog = createDebugLogger(
  'validateERC20Asset(FSM_Core)',
  DEBUG_ENABLED,
  LOG_TIME,
);

// Lowercased sentinel for native token (e.g. 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
const NATIVE_SENTINEL = (
  NATIVE_TOKEN_ADDRESS ?? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
).toLowerCase();

// Panels that should resolve to WalletAccount, not TokenContract
const ACCOUNT_LIKE_PANELS = new Set<SP_COIN_DISPLAY>([
  SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL_OLD,
  SP_COIN_DISPLAY.AGIENT_LIST_SELECT_PANEL_OLD,
  SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL,
]);

export async function validateERC20Asset(
  params: ValidateFSMInput,
): Promise<ValidateFSMOutput> {
  const {
    containerType,
    debouncedHexInput,
    publicClient,
    feedType,
    instanceId,
  } = params as any;

  const containerLabel = SP_COIN_DISPLAY[containerType] ?? String(containerType);
  const addr = (debouncedHexInput ?? '').trim();

  debugLog.log?.('🟢 [ENTRY] validateERC20Asset', {
    containerType,
    containerLabel,
    instanceId: instanceId ?? '—',
    debouncedHexInput: addr || '«empty»',
    hasPublicClient: !!publicClient,
    feedType,
  });

  // 🔐 Policy gate
  const studyEnabled = isStudyEnabled(containerType, StudyId.RESOLVE_ERC20_ASSET);
  debugLog.log?.('🔍 Policy check', {
    studyId: 'RESOLVE_ERC20_ASSET',
    containerType,
    containerLabel,
    enabled: studyEnabled,
  });

  if (!studyEnabled) {
    debugLog.log?.(
      '🚧 Policy disabled for RESOLVE_ERC20_ASSET → RETURN_VALIDATED_ASSET',
      {
        containerType,
        containerLabel,
        instanceId: instanceId ?? '—',
      },
    );
    return { nextState: InputState.RETURN_VALIDATED_ASSET };
  }

  // Account-like flows: build WalletAccount via assetPatch & finish
  if (ACCOUNT_LIKE_PANELS.has(containerType)) {
    debugLog.log?.('🟡 Account-like panel branch', {
      containerType,
      containerLabel,
      addr,
    });

    if (!addr || !isAddress(addr)) {
      const msg = `Invalid or empty address for account-like panel: "${addr}"`;
      debugLog.warn?.('⛔ Invalid account-like address', {
        containerType,
        containerLabel,
        addr,
      });
      return {
        nextState: InputState.MISSING_ACCOUNT_ADDRESS,
        errorMessage: msg,
      };
    }

    const chainId =
      (publicClient?.chain?.id as number | undefined) ??
      (params as any)?.appChainId ??
      params.chainId ??
      1;

    const assetPatch = {
      address: addr as `0x${string}`,
      chainId,
    } as any;

    debugLog.log?.('✅ Account-like assetPatch prepared', {
      containerType,
      containerLabel,
      instanceId: instanceId ?? '—',
      assetPatch,
    });

    return {
      nextState: InputState.RETURN_VALIDATED_ASSET,
      assetPatch,
    };
  }

  // 🪙 Native token: skip ERC-20 resolution entirely.
  const isNative = !!addr && addr.toLowerCase() === NATIVE_SENTINEL;

  if (isNative) {
    debugLog.log?.(
      '🟡 Native token detected → skipping ERC-20 resolution step',
      {
        address: addr,
        containerType,
        containerLabel,
        instanceId: instanceId ?? '—',
      },
    );

    // Let validateFSMCore handle the manualEntry → VALIDATE_PREVIEW reroute
    // when nextState === RETURN_VALIDATED_ASSET.
    return { nextState: InputState.RETURN_VALIDATED_ASSET };
  }

  // Token-like ERC-20 flows: delegate to token resolver (which should also return assetPatch)
  try {
    debugLog.log?.('🟣 Delegating to validateCreateERC20Asset', {
      containerType,
      containerLabel,
      instanceId: instanceId ?? '—',
      address: addr || '«empty»',
    });

    const result = await validateCreateERC20Asset(params);

    if (!result || result.nextState === undefined) {
      const msg =
        'validateCreateERC20Asset returned no nextState; mapping to VALIDATE_ERC20_ASSET_ERROR';
      debugLog.warn?.(
        '⚠️ validateCreateERC20Asset returned invalid result',
        {
          containerType,
          containerLabel,
          instanceId: instanceId ?? '—',
          address: addr,
          rawResult: result,
        },
      );
      return {
        nextState: InputState.VALIDATE_ERC20_ASSET_ERROR,
        errorMessage: msg,
      };
    }

    debugLog.log?.('✅ validateCreateERC20Asset result', {
      containerType,
      containerLabel,
      instanceId: instanceId ?? '—',
      nextState: InputState[result.nextState] ?? result.nextState,
      hasValidatedAsset: !!(result as any).validatedAsset,
      hasResolvedAsset: !!(result as any).resolvedAsset,
      hasAssetPatch: !!(result as any).assetPatch,
    });

    return result;
  } catch (err: any) {
    const msg =
      'validateCreateERC20Asset threw; mapping to VALIDATE_ERC20_ASSET_ERROR';

    debugLog.error?.(msg, {
      containerType,
      containerLabel,
      instanceId: instanceId ?? '—',
      address: addr,
      errorMessage: err?.message ?? String(err),
      stack: err?.stack,
    });

    return {
      nextState: InputState.VALIDATE_ERC20_ASSET_ERROR,
      errorMessage:
        err instanceof Error ? err.message : 'Unknown error validating ERC-20 asset',
    };
  }
}
