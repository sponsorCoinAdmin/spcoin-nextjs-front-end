// File: lib/hooks/inputValidations/FSM_Core/validationTests/validateTokenAsset.ts
import { isAddress, type Address } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import type { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const log = createDebugLogger('validateTokenAsset(FSM_Core)', DEBUG_ENABLED, false);

// Minimal ERC-20 ABI (read-only)
const ERC20_ABI = [
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'symbol',   stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'name',     stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
] as const;

/**
 * Resolve a token contract into an assetPatch suitable for UPDATE_VALIDATED_ASSET.
 * Assumes on-chain existence was already handled by VALIDATE_EXISTS_ON_CHAIN.
 */
export async function validateTokenAsset(params: ValidateFSMInput): Promise<ValidateFSMOutput> {
  const { debouncedHexInput, publicClient, chainId } = params;
  const addr = (debouncedHexInput ?? '').trim() as Address;

  // 1) Native token short-circuit
  if (addr === NATIVE_TOKEN_ADDRESS) {
    log.log?.('native token → UPDATE_VALIDATED_ASSET');
    return {
      nextState: InputState.UPDATE_VALIDATED_ASSET,
      assetPatch: {
        address: NATIVE_TOKEN_ADDRESS as Address,
        chainId,
        // name/symbol/decimals typically filled from chain config elsewhere
      } as any,
    };
  }

  // 2) Basic guards
  if (!addr || !isAddress(addr)) {
    const msg = `Invalid token address "${addr}"`;
    log.warn?.(msg);
    return { nextState: InputState.RESOLVE_ASSET_ERROR, errorMessage: msg };
  }
  if (!publicClient) {
    const msg = `Public client missing for token resolve (chainId=${chainId})`;
    log.warn?.(msg);
    return { nextState: InputState.RESOLVE_ASSET_ERROR, errorMessage: msg };
  }

  // 3) Try to fetch ERC-20 metadata (graceful fallbacks)
  const readNumber = async (fn: 'decimals'): Promise<number | undefined> => {
    try {
      const out = await publicClient.readContract({
        address: addr,
        abi: ERC20_ABI as any,
        functionName: fn,
      });
      return typeof out === 'number' ? out : Number(out);
    } catch (e) {
      log.warn?.(`read ${fn} failed: ${(e as Error).message}`);
      return undefined;
    }
  };

  const readString = async (fn: 'symbol' | 'name'): Promise<string | undefined> => {
    try {
      const out = await publicClient.readContract({
        address: addr,
        abi: ERC20_ABI as any,
        functionName: fn,
      });
      return typeof out === 'string' ? out : String(out);
    } catch (e) {
      log.warn?.(`read ${fn} failed: ${(e as Error).message}`);
      return undefined;
    }
  };

  const [decimals, symbol, name] = await Promise.all([
    readNumber('decimals'),
    readString('symbol'),
    readString('name'),
  ]);

  // 4) Build the patch; proceed even if metadata is partial
  const patch: any = { address: addr, chainId };
  if (typeof decimals === 'number' && !Number.isNaN(decimals)) patch.decimals = decimals;
  if (symbol) patch.symbol = symbol;
  if (name) patch.name = name;

  if (!symbol && !name && decimals === undefined) {
    // Metadata completely missing — still proceed with bare token patch
    log.warn?.(`metadata not available for ${addr}; proceeding with bare patch`);
  } else {
    log.log?.('token resolved → UPDATE_VALIDATED_ASSET', patch);
  }

  return {
    nextState: InputState.UPDATE_VALIDATED_ASSET,
    assetPatch: patch,
  };
}
