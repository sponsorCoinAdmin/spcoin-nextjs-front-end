// File: lib/hooks/inputValidations/FSM_Core/validationTests/validateExistsOnChain.ts
'use client';

import type { Address } from 'viem';
import { isAddress } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';
import { FEED_TYPE, NATIVE_TOKEN_ADDRESS, SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import type { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { isStudyEnabled, StudyId } from '../studyPolicy';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const log = createDebugLogger('validateExistsOnChain(FSM_Core)', DEBUG_ENABLED, /* timestamp */ false);

// ---- Surface the real RPC endpoint ----
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
  log.log?.(`[${traceId}] [RPC] getBytecode(start) @ ${rpcUrl ?? '∅'}`, { address } as any);
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
 * On-chain existence gate.
 * - TOKEN_LIST flows require contract bytecode (except native token).
 * - Non-token flows accept EOAs (bytecode '0x') as valid accounts.
 * - Native token address short-circuits (case-insensitive) to RESOLVE_ASSET.
 *
 * ⚙️ Policy-aware: respects studyPolicy for VALIDATE_EXISTS_ON_CHAIN.
 */
export async function validateExistsOnChain(
  {
    debouncedHexInput,
    publicClient,
    feedType,
    appChainId,
    containerType,
  }: ValidateFSMInput & { appChainId?: number; containerType: SP_COIN_DISPLAY }
): Promise<ValidateFSMOutput> {
  const addr = (debouncedHexInput ?? '').trim() as Address;
  const traceId = Math.random().toString(36).slice(2, 8);

  const clientSummary = summarizeClient(publicClient);
  const clientChainId = clientSummary.chainId as number | undefined;
  const rpcUrl = clientSummary.transportUrl;

  // Case-insensitive native token detection
  const NATIVE_LC = NATIVE_TOKEN_ADDRESS.toLowerCase();
  const isNativeCaseInsensitive = addr.toLowerCase() === NATIVE_LC;

  log.log?.(
    `[${traceId}] [ENTRY] validateExistsOnChain`,
    {
      address: addr,
      isAddress: isAddress(addr || '0x'),
      isNativeStrict: addr === NATIVE_TOKEN_ADDRESS,
      isNativeCaseInsensitive,
      feedType,
      appChainId,
      clientChainId,
      clientChainName: clientSummary.chainName,
      rpcTransportType: clientSummary.transportType,
      rpcUrl,
      containerType: SP_COIN_DISPLAY[containerType],
    } as any
  );

  // 🔐 Policy gate — allow selective bypass per panel
  if (!isStudyEnabled(containerType, StudyId.VALIDATE_EXISTS_ON_CHAIN)) {
    log.log?.(
      `[${traceId}] [POLICY] VALIDATE_EXISTS_ON_CHAIN disabled for ${SP_COIN_DISPLAY[containerType]} → RESOLVE_ASSET`
    );
    return { nextState: InputState.RESOLVE_ASSET };
  }

  // ✅ Native token has no bytecode; short-circuit (case-insensitive)
  if (isNativeCaseInsensitive) {
    log.log?.(
      `[${traceId}] [SHORT-CIRCUIT] Native token (${NATIVE_TOKEN_ADDRESS}) matched case-insensitively → RESOLVE_ASSET`
    );
    return { nextState: InputState.RESOLVE_ASSET };
  }

  // Guards
  if (!publicClient) {
    const msg = `Public client missing (appChainId=${appChainId ?? '∅'})`;
    log.warn?.(`[${traceId}] [ABORT] ${msg}`);
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: msg,
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

  // Hard-stop on chain mismatch (prevents false negatives)
  if (
    typeof appChainId === 'number' &&
    typeof clientChainId === 'number' &&
    appChainId !== clientChainId
  ) {
    const msg = `Chain mismatch: app=${appChainId}, client=${clientChainId} (${clientSummary.chainName}) @ ${clientSummary.transportType} ${rpcUrl}`;
    log.warn?.(`[${traceId}] [MISMATCH] ${msg}`);
    return {
      nextState: InputState.RESOLVE_ASSET_ERROR,
      errorMessage: msg,
    };
  }

  try {
    // Bytecode probe (with one retry)
    let bytecode = await getBytecodeWithTiming(publicClient, addr, traceId, rpcUrl);
    let exists = !!bytecode && bytecode !== '0x';

    if (!exists) {
      log.warn?.(
        `[${traceId}] [RETRY] Empty bytecode returned; retrying once…`,
        { addr, clientChainId, rpcUrl } as any
      );
      await new Promise((r) => setTimeout(r, 150));
      bytecode = await getBytecodeWithTiming(publicClient, addr, traceId, rpcUrl);
      exists = !!bytecode && bytecode !== '0x';
    }

    if (feedType === FEED_TYPE.TOKEN_LIST) {
      // Token flow: require contract code (but native already short-circuited above)
      if (!exists) {
        const why = bytecode === null ? 'null' : bytecode === '0x' ? 'EOA-or-no-code' : `len=${bytecode.length}`;
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
    } else {
      // Account-like flows: EOA or contract → both acceptable
      if (bytecode === null) {
        const msg = `Bytecode read failed (null) via ${rpcUrl}`;
        log.warn?.(
          `[${traceId}] [RESULT] Transport issue → CONTRACT_NOT_FOUND_ON_BLOCKCHAIN`,
          { addr, clientChainId, rpcUrl } as any
        );
        return {
          nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
          errorMessage: msg,
        };
      }

      const kind = bytecode === '0x' ? 'EOA' : `contract(len=${bytecode.length})`;
      log.log?.(
        `[${traceId}] [RESULT] ${kind} acceptable for non-token flow → RESOLVE_ASSET`,
        { addr, clientChainId, rpcUrl } as any
      );
      return { nextState: InputState.RESOLVE_ASSET };
    }
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err);
    log.warn?.(
      `[${traceId}] [ERROR] getBytecode exception`,
      { addr, clientChainId, rpcUrl, error: msg } as any
    );
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: `Bytecode read failed via ${rpcUrl}: ${msg}`,
    };
  }
}
