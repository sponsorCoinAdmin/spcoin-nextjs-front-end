import { type Abi, type Address, type PublicClient } from 'viem';
import { isAddress } from '@/lib/utils/address';
import { InputState } from '@/lib/structure/assetSelection';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';
import type {
  ValidateFSMInput,
  ValidateFSMOutput,
} from '../types/validateFSMTypes';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_FSM === 'true';
const debugLog = createDebugLogger(
  'validateCreateERC20Asset(FSM_Core)',
  DEBUG_ENABLED,
  LOG_TIME,
);

const ERC20_ABI = [
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
] as const satisfies Abi;

interface ClientDebugSnapshot {
  chain?: {
    id?: number;
    rpcUrls?: {
      default?: {
        http?: string[];
        webSocket?: string[];
      };
    };
  };
  transport?: {
    type?: string;
    url?: string;
    value?: {
      url?: string;
    };
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'unknown error';
}

function getShortErrorMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  if (!('shortMessage' in error)) return undefined;
  const shortMessage = (error as { shortMessage?: unknown }).shortMessage;
  return typeof shortMessage === 'string' ? shortMessage : undefined;
}

export async function validateCreateERC20Asset(
  params: ValidateFSMInput,
): Promise<ValidateFSMOutput> {
  const debouncedHexInput = params.debouncedHexInput;
  const chainId = params.chainId;
  const publicClientUnknown: unknown = params.publicClient;
  const addrInput = (debouncedHexInput ?? '').trim();

  const debugClient = publicClientUnknown as ClientDebugSnapshot;
  const clientChainId = debugClient.chain?.id;

  debugLog.log?.('validateCreateERC20Asset entry', {
    addr: addrInput,
    chainIdParam: chainId,
    clientChainId,
    hasPublicClient: !!publicClientUnknown,
  });

  if (addrInput === NATIVE_TOKEN_ADDRESS) {
    return {
      nextState: InputState.RETURN_VALIDATED_ASSET,
      assetPatch: {
        address: NATIVE_TOKEN_ADDRESS as Address,
        chainId,
      } as ValidateFSMOutput['assetPatch'],
    };
  }

  if (!addrInput || !isAddress(addrInput)) {
    const msg = `Invalid token address "${addrInput}"`;
    debugLog.warn?.(msg);
    return {
      nextState: InputState.VALIDATE_ERC20_ASSET_ERROR,
      errorMessage: msg,
    };
  }
  const addr = addrInput as Address;

  if (!publicClientUnknown) {
    const msg = `Public client missing for token resolve (chainId=${chainId})`;
    debugLog.warn?.(msg);
    return {
      nextState: InputState.VALIDATE_ERC20_ASSET_ERROR,
      errorMessage: msg,
    };
  }
  const client = publicClientUnknown as PublicClient;

  try {
    const transport = debugClient.transport;
    const rpcUrl =
      transport?.url ??
      transport?.value?.url ??
      debugClient.chain?.rpcUrls?.default?.http?.[0] ??
      debugClient.chain?.rpcUrls?.default?.webSocket?.[0];

    debugLog.log?.('publicClient transport snapshot', {
      addr,
      chainIdParam: chainId,
      clientChainId,
      transportType: transport?.type,
      rpcUrl,
      rawTransport: transport,
      chainRpcUrls: debugClient.chain?.rpcUrls,
    });
  } catch (error: unknown) {
    debugLog.warn?.('failed to introspect publicClient transport', {
      msg: getErrorMessage(error),
    });
  }

  const readNumber = async (fn: 'decimals'): Promise<number | undefined> => {
    try {
      const out = await client.readContract({
        address: addr,
        abi: ERC20_ABI,
        functionName: fn,
      });
      const n = typeof out === 'number' ? out : Number(out);
      debugLog.log?.(`read ${fn} ok`, { addr, chainIdParam: chainId, clientChainId, value: n });
      return n;
    } catch (error: unknown) {
      const msg = getShortErrorMessage(error) ?? getErrorMessage(error);
      debugLog.warn?.(`read ${fn} failed`, {
        addr,
        chainIdParam: chainId,
        clientChainId,
        error: msg,
      });
      return undefined;
    }
  };

  const readString = async (fn: 'symbol' | 'name'): Promise<string | undefined> => {
    try {
      const out = await client.readContract({
        address: addr,
        abi: ERC20_ABI,
        functionName: fn,
      });
      const s = typeof out === 'string' ? out : String(out);
      debugLog.log?.(`read ${fn} ok`, { addr, chainIdParam: chainId, clientChainId, value: s });
      return s;
    } catch (error: unknown) {
      const msg = getShortErrorMessage(error) ?? getErrorMessage(error);
      debugLog.warn?.(`read ${fn} failed`, {
        addr,
        chainIdParam: chainId,
        clientChainId,
        error: msg,
      });
      return undefined;
    }
  };

  const [decimals, symbol, name] = await Promise.all([
    readNumber('decimals'),
    readString('symbol'),
    readString('name'),
  ]);

  const patch: Record<string, unknown> = { address: addr, chainId };
  if (typeof decimals === 'number' && !Number.isNaN(decimals)) patch.decimals = decimals;
  if (symbol) patch.symbol = symbol;
  if (name) patch.name = name;

  if (typeof chainId === 'number') {
    patch.logoURL = getTokenLogoURL({ chainId, address: addr });
  }

  if (!symbol && !name && decimals === undefined) {
    debugLog.warn?.(`metadata not available for ${addr}; proceeding with bare patch`);
  }

  return {
    nextState: InputState.RETURN_VALIDATED_ASSET,
    assetPatch: patch as ValidateFSMOutput['assetPatch'],
  };
}
