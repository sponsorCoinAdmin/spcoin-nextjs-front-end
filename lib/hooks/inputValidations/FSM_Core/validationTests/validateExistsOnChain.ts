// File: lib/hooks/inputValidations/FSM_Core/validationTests/validateExistsOnChain.ts
import type { Address } from 'viem';
import { isAddress } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const log = createDebugLogger('validateExistsOnChain(FSM_Core)', DEBUG_ENABLED, /* timestamp */ false);

// Small helpers for better diagnostics
const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

function summarizeClient(client: any) {
  const chainId = client?.chain?.id;
  const chainName = client?.chain?.name;
  const t = client?.transport;
  // viem http transport usually exposes .url; sometimes behind .value or .config
  const transportUrl = t?.url ?? t?.value?.url ?? t?.config?.url;
  const transportType = t?.type ?? t?.key ?? t?.name;
  return { chainId, chainName, transportType, transportUrl };
}

async function getBytecodeWithTiming(publicClient: any, address: Address, traceId: string) {
  const t0 = now();
  log.log?.(`[${traceId}] [RPC] getBytecode(start)`, { address } as any);
  const bytecode = await publicClient.getBytecode({ address });
  const t1 = now();
  const len = bytecode ? bytecode.length : 0;
  log.log?.(
    `[${traceId}] [RPC] getBytecode(done) ${Math.round(t1 - t0)}ms, len=${len}`,
    len ? { head: bytecode.slice(0, 10), tail: bytecode.slice(-10) } as any : undefined
  );
  return bytecode as string | null;
}

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
  const traceId = Math.random().toString(36).slice(2, 8);

  const clientSummary = summarizeClient(publicClient);
  const clientChainId = clientSummary.chainId as number | undefined;

  log.log?.(`[${traceId}] [ENTRY]`, {
    address: addr,
    isAddress: isAddress(addr || '0x'),
    isNative: addr === NATIVE_TOKEN_ADDRESS,
    appChainId,
    clientChainId,
    clientChainName: clientSummary.chainName,
    transportType: clientSummary.transportType,
    transportUrl: clientSummary.transportUrl,
  } as any);

  // Native token: treated as existing (no bytecode on chain)
  if (addr === NATIVE_TOKEN_ADDRESS) {
    log.log?.(`[${traceId}] [SHORT-CIRCUIT] Native token → RESOLVE_ASSET`);
    return { nextState: InputState.RESOLVE_ASSET };
  }

  // Guards
  if (!publicClient) {
    log.warn?.(`[${traceId}] [ABORT] Missing publicClient`);
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: 'Public client missing',
    };
  }

  if (!addr || !isAddress(addr)) {
    log.warn?.(`[${traceId}] [ABORT] Invalid address`, { addr } as any);
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: 'Invalid address',
    };
  }

  // Helpful warning if caller passed appChainId and client is on a different chain
  if (typeof appChainId === 'number' && typeof clientChainId === 'number' && appChainId !== clientChainId) {
    log.warn?.(
      `[${traceId}] [MISMATCH] Client not pinned to appChainId`,
      { appChainId, clientChainId, clientChainName: clientSummary.chainName } as any
    );
  }

  try {
    // First attempt
    let bytecode = await getBytecodeWithTiming(publicClient, addr, traceId);
    let exists = !!bytecode && bytecode !== '0x';

    // One retry for transient empty-code responses (some RPCs do this)
    if (!exists) {
      log.warn?.(
        `[${traceId}] [RETRY] Empty bytecode returned; retrying once…`,
        { addr, clientChainId } as any
      );
      // brief micro-delay to avoid hammering same node path
      await new Promise((r) => setTimeout(r, 150));
      bytecode = await getBytecodeWithTiming(publicClient, addr, traceId);
      exists = !!bytecode && bytecode !== '0x';
    }

    if (!exists) {
      log.log?.(`[${traceId}] [RESULT] No bytecode → CONTRACT_NOT_FOUND_ON_BLOCKCHAIN`, {
        addr,
        clientChainId,
      } as any);
      return { nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN };
    }

    log.log?.(
      `[${traceId}] [RESULT] Bytecode found (len=${bytecode!.length}) → RESOLVE_ASSET`,
      { addr, clientChainId } as any
    );
    return { nextState: InputState.RESOLVE_ASSET };
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err);
    log.warn?.(
      `[${traceId}] [ERROR] getBytecode failed`,
      { addr, clientChainId, error: msg } as any
    );
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: 'Bytecode read failed',
    };
  }
}
