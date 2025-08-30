// File: lib/hooks/inputValidations/FSM_Core/validationTests/validateExistsOnChain.ts

import type { Address } from 'viem';
import { isAddress } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/context/helpers/NetworkHelpers';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const log = createDebugLogger('validateExistsOnChain(FSM_Core)', DEBUG_ENABLED, /* timestamp */ false);

/**
 * Called by FSM core. `publicClient` must already be constructed for the app's canonical chain.
 * If your caller can provide `appChainId`, include it for clearer diagnostics.
 */
export async function validateExistsOnChain(
  {
    debouncedHexInput,
    publicClient,
    // Optional, for logging: pass if available at call site
    appChainId,
  }: ValidateFSMInput & { appChainId?: number }
): Promise<ValidateFSMOutput> {
  const addr = (debouncedHexInput ?? '').trim() as Address;
  const clientChainId = (publicClient as any)?.chain?.id as number | undefined;

  log.log?.('[ENTRY]', {
    address: addr,
    isAddress: isAddress(addr || '0x'),
    isNative: addr === NATIVE_TOKEN_ADDRESS,
    appChainId,
    clientChainId,
  } as any);

  // Native token: treated as existing (no bytecode on chain)
  if (addr === NATIVE_TOKEN_ADDRESS) {
    log.log?.('[SHORT-CIRCUIT] Native token → RESOLVE_ASSET');
    return { nextState: InputState.RESOLVE_ASSET };
  }

  // Guards
  if (!publicClient) {
    log.warn?.('[ABORT] Missing publicClient');
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: 'Public client missing',
    };
  }

  if (!addr || !isAddress(addr)) {
    log.warn?.('[ABORT] Invalid address', { addr } as any);
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: 'Invalid address',
    };
  }

  // Helpful warning if caller passed appChainId and client is on a different chain
  if (typeof appChainId === 'number' && typeof clientChainId === 'number' && appChainId !== clientChainId) {
    log.warn?.('[MISMATCH] Client not pinned to appChainId', { appChainId, clientChainId } as any);
  }

  try {
    const bytecode = await publicClient.getBytecode({ address: addr });
    const exists = !!bytecode && bytecode !== '0x';

    if (!exists) {
      log.log?.('[RESULT] No bytecode → CONTRACT_NOT_FOUND_ON_BLOCKCHAIN', {
        addr,
        clientChainId,
      } as any);
      return { nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN };
    }

    log.log?.(`[RESULT] Bytecode found (len=${bytecode.length}) → RESOLVE_ASSET`, {
      addr,
      clientChainId,
    } as any);
    return { nextState: InputState.RESOLVE_ASSET };
  } catch (err) {
    log.warn?.('[ERROR] getBytecode failed', {
      addr,
      clientChainId,
      error: (err as Error)?.message,
    } as any);
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: 'Bytecode read failed',
    };
  }
}
