// File: lib/hooks/inputValidations/FSM_Core/validationTests/resolveAsset.ts
import { isAddress } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import type { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { isStudyEnabled, StudyId } from '../studyPolicy';
import { validateTokenAsset } from './validateTokenAsset';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const log = createDebugLogger('resolveAsset(FSM_Core)', DEBUG_ENABLED, false);

// Panels that should resolve to WalletAccount, not TokenContract
const ACCOUNT_LIKE_PANELS = new Set<SP_COIN_DISPLAY>([
  SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
  SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,  SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL,
]);

export async function resolveAsset(params: ValidateFSMInput): Promise<ValidateFSMOutput> {
  const { containerType, debouncedHexInput, publicClient } = params;

  // 🔐 Policy gate
  if (!isStudyEnabled(containerType, StudyId.RESOLVE_ASSET)) {
    log.log?.(
      `policy: RESOLVE_ASSET disabled for ${SP_COIN_DISPLAY[containerType]} → UPDATE_VALIDATED_ASSET`
    );
    return { nextState: InputState.UPDATE_VALIDATED_ASSET };
  }

  // Account-like flows: build WalletAccount via assetPatch & finish
  if (ACCOUNT_LIKE_PANELS.has(containerType)) {
    const addr = (debouncedHexInput ?? '').trim();
    if (!addr || !isAddress(addr)) {
      const msg = `Invalid or empty address for account-like panel: "${addr}"`;
      log.warn?.(msg);
      return { nextState: InputState.MISSING_ACCOUNT_ADDRESS, errorMessage: msg };
    }

    const chainId =
      (publicClient?.chain?.id as number | undefined) ?? (params as any)?.appChainId ?? params.chainId ?? 1;

    // Return patch-only per your ValidateFSMOutput type
    return {
      nextState: InputState.UPDATE_VALIDATED_ASSET,
      assetPatch: {
        // Minimal WalletAccount shape; your update step can enrich if needed
        address: addr as `0x${string}`,
        chainId,
      } as any,
    };
  }

  // Token-like flows: delegate to token resolver (which should also return assetPatch)
  return await validateTokenAsset(params);
}
