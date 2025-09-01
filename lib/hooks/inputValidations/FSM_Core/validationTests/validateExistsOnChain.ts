// File: lib/hooks/inputValidations/FSM_Core/validationTests/validateExistsOnChain.ts

import type { Address } from 'viem';
import { isAddress } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const log = createDebugLogger(
  'validateExistsOnChain(FSM_Core)',
  DEBUG_ENABLED,
  /* timestamp */ false
);

// ---- Transport helpers to surface the real RPC endpoint ----
function getTransportUrl(t: any): string | undefined {
  return t?.url ?? t?.value?.url ?? t?.config?.url ?? t?.details?.url;
}
function getTransportType(t: any): string | undefined {
  return t?.type ?? t?.key ?? t?.name ?? t?.constructor?.name;
}
function summarizeClient(client: any) {
  const chainId = client?.chain?.id;
  const chainName = client?.chain?.name;
  const t = client?.transport;
  return {
    chainId,
    chainName,
    transportType: getTransportType(t),
    transportUrl: getTransportUrl(t),
  };
}

const now = () =>
  (typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now());

async function getBytecodeWithTiming(
  publicClient: any,
  address: Address,
  traceId: string,
  rpcUrl?: string
) {
  const t0 = now();
  log.log?.(
    `[${traceId}] [RPC] getBytecode(start) @ ${rpcUrl ?? '∅'}`,
    { address } as any
  );
  const bytecode = await publicClient.getBytecode({ address });
  const t1 = now();
  const len = bytecode ? bytecode.length : 0;
  log.log?.(
    `[${traceId}] [RPC] getBytecode(done) ${Math.round(t1 - t0)}ms, len=${len} @ ${rpcUrl ?? '∅'}`,
    len ? ({ head: bytecode.slice(0, 10), tail: bytecode.slice(-10) } as any) : undefined
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
  const rpcUrl = clientSummary.transportUrl;

  log.log?.(
    `[${traceId}] [ENTRY] validateExistsOnChain`,
    {
      address: addr,
      isAddress: isAddress(addr || '0x'),
      isNative: addr === NATIVE_TOKEN_ADDRESS,
      appChainId,
      clientChainId,
      clientChainName: clientSummary.chainName,
      rpcTransportType: clientSummary.transportType,
      rpcUrl, // 👈 explicit URL in logs
    } as any
  );

  // Native token: treated as existing (no bytecode on chain)
  if (addr === NATIVE_TOKEN_ADDRESS) {
    log.log?.(`[${traceId}] [SHORT-CIRCUIT] Native token → RESOLVE_ASSET`);
    return { nextState: InputState.RESOLVE_ASSET };
  }

  // Guards
  if (!publicClient) {
    const msg = `Public client missing (appChainId=${appChainId ?? '∅'})`;
    log.warn?.(`[${traceId}] [ABORT] ${msg}`);
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: `${msg}`,
    };
  }

  if (!addr || !isAddress(addr)) {
    const msg = `Invalid address "${addr}"`;
    log.warn?.(`[${traceId}] [ABORT] ${msg}`);
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: msg,
    };
  }

  // Hard-stop on chain mismatch to avoid false "not found"
  if (
    typeof appChainId === 'number' &&
    typeof clientChainId === 'number' &&
    appChainId !== clientChainId
  ) {
    const msg = `Chain mismatch: app=${appChainId}, client=${clientChainId} (${clientSummary.chainName}) @ ${clientSummary.transportType} ${rpcUrl}`;
    log.warn?.(`[${traceId}] [MISMATCH] ${msg}`);
    return {
      nextState: InputState.RESOLVE_ASSET_ERROR,
      errorMessage: msg, // 👈 bubbles to UI
    };
  }

  try {
    // First attempt
    let bytecode = await getBytecodeWithTiming(publicClient, addr, traceId, rpcUrl);
    let exists = !!bytecode && bytecode !== '0x';

    // One retry for transient empty-code responses (some RPCs do this)
    if (!exists) {
      log.warn?.(
        `[${traceId}] [RETRY] Empty bytecode returned; retrying once…`,
        { addr, clientChainId, rpcUrl } as any
      );
      await new Promise((r) => setTimeout(r, 150));
      bytecode = await getBytecodeWithTiming(publicClient, addr, traceId, rpcUrl);
      exists = !!bytecode && bytecode !== '0x';
    }

    if (!exists) {
      const why =
        bytecode === null ? 'null' :
        bytecode === '0x' ? 'EOA-or-no-code' :
        `len=${bytecode.length}`;
      log.log?.(
        `[${traceId}] [RESULT] No bytecode (${why}) → CONTRACT_NOT_FOUND_ON_BLOCKCHAIN`,
        { addr, clientChainId, rpcUrl } as any
      );
      return {
        nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
        errorMessage: `No bytecode (${why}) on chain ${clientChainId} via ${rpcUrl}`,
      };
    }

    log.log?.(
      `[${traceId}] [RESULT] Bytecode found (len=${bytecode!.length}) → RESOLVE_ASSET`,
      { addr, clientChainId, rpcUrl } as any
    );
    return { nextState: InputState.RESOLVE_ASSET };
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err);
    log.warn?.(
      `[${traceId}] [ERROR] getBytecode failed`,
      { addr, clientChainId, rpcUrl, error: msg } as any
    );
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: `Bytecode read failed via ${rpcUrl}: ${msg}`,
    };
  }
}
