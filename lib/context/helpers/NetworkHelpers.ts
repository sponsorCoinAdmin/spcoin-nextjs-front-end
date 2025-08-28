// File: lib/context/helpers/NetworkHelpers.ts

import rawChainIdList from '@/resources/data/networks/chainIds.json';
import type { NetworkElement } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_UTILS === 'true';
const debugLog = createDebugLogger('NetworkHelpers', DEBUG_ENABLED, /* timestamp */ false);

/* ────────────────────────────────────────────────────────────────────────── *
 *                         Chain list normalization / map
 * ────────────────────────────────────────────────────────────────────────── */

type ChainMeta = { chainId?: number | string; name?: string; symbol?: string };

function normalizeChainList(input: any): ChainMeta[] {
  if (Array.isArray(input)) return input as ChainMeta[];
  if (Array.isArray(input?.default)) return input.default as ChainMeta[];
  if (Array.isArray(input?.list)) return input.list as ChainMeta[];
  if (Array.isArray(input?.chains)) return input.chains as ChainMeta[];
  if (input && typeof input === 'object') {
    const values = Object.values(input);
    if (values.length && typeof values[0] === 'object') return values as ChainMeta[];
  }
  return [];
}

const chainIdMap: Map<number, { name?: string; symbol?: string }> = (() => {
  const chainList = normalizeChainList(rawChainIdList);
  const map = new Map<number, { name?: string; symbol?: string }>();
  for (const e of chainList) {
    const idNum = Number((e as any)?.chainId);
    if (!Number.isFinite(idNum)) continue;
    map.set(idNum, {
      name: (e?.name ?? '').toString().trim(),
      symbol: (e?.symbol ?? '').toString().trim(),
    });
  }
  return map;
})();

/** Meta lookup with warnings when missing/partial */
function getNetworkMeta(chainId: number) {
  const key = Number(chainId);
  const meta = chainIdMap.get(key);
  if (!meta) {
    debugLog.warn?.(
      `[NetworkHelpers] No chain meta for chainId=${key} — check resources/data/networks/chainIds.json`
    );
    return undefined;
  }
  if (!meta.name) {
    debugLog.warn?.(`[NetworkHelpers] Missing 'name' for chainId=${key}`);
  }
  if (!meta.symbol) {
    debugLog.warn?.(`[NetworkHelpers] Missing 'symbol' for chainId=${key} (${meta.name ?? 'Unknown'})`);
  }
  return meta;
}

/* ────────────────────────────────────────────────────────────────────────── *
 *                             Public network getters
 * ────────────────────────────────────────────────────────────────────────── */

export const getBlockChainLogoURL = (chainId: number): string =>
  `/assets/blockchains/${chainId}/info/network.png`;

export const getBlockChainName = (chainId: number): string | undefined =>
  getNetworkMeta(chainId)?.name;

export const getBlockChainSymbol = (chainId: number): string | undefined =>
  getNetworkMeta(chainId)?.symbol;

export const getBlockExplorerURL = (chainId: number): string => {
  switch (chainId) {
    case 1:        return 'https://etherscan.io/';
    case 5:        return 'https://goerli.etherscan.io/';
    case 137:      return 'https://polygonscan.com/';
    case 80001:    return 'https://mumbai.polygonscan.com/';
    case 11155111: return 'https://sepolia.etherscan.io/';
    case 31337:    return 'http://localhost:8545/';
    default:       return '';
  }
};

/* ────────────────────────────────────────────────────────────────────────── *
 *                        NetworkElement construction
 * ────────────────────────────────────────────────────────────────────────── */

function stripChainDerivedFields(prev?: Partial<NetworkElement> | null) {
  if (!prev) return {} as Partial<NetworkElement>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name: _n, symbol: _s, logoURL: _l, url: _u, ...rest } = prev;
  return rest as Partial<NetworkElement>;
}

/**
 * Build a NetworkElement from chainId and previous value.
 * SAME_CHAIN path ENFORCES the derived symbol to auto-repair stale state.
 */
export function resolveNetworkElement(
  chainId: number,
  prev?: Partial<NetworkElement> | null
): NetworkElement {
  const prevId = prev?.chainId;

  const derivedName   = getBlockChainName(chainId)    || '';
  const derivedLogo   = getBlockChainLogoURL(chainId) || '';
  const derivedUrl    = getBlockExplorerURL(chainId)  || '';
  const derivedSymbol = getBlockChainSymbol(chainId)  || '';

  if (prevId !== chainId) {
    const rest = stripChainDerivedFields(prev);
    const next = {
      ...rest,
      chainId,
      name:   derivedName,
      symbol: derivedSymbol,
      logoURL: derivedLogo,
      url:     derivedUrl,
    } as NetworkElement;

    // Guard: symbol should always be chain-derived
    if (!derivedSymbol || next.symbol !== derivedSymbol) {
      debugLog.warn?.('[NetworkHelpers] Symbol mismatch on CHAIN_CHANGED', {
        chainId, expected: derivedSymbol, got: next.symbol,
      } as any);
    }
    return next;
  }

  // Same chain → backfill + enforce derived symbol to repair stale storage
  const base = { ...(prev ?? {}), chainId } as NetworkElement;
  const next = {
    ...base,
    name:   base.name   || derivedName,
    logoURL: base.logoURL || derivedLogo,
    url:     base.url     || derivedUrl,
    symbol:  derivedSymbol, // enforce
  } as NetworkElement;

  if (base.symbol && base.symbol !== derivedSymbol) {
    debugLog.warn?.('[NetworkHelpers] Repaired stale symbol (SAME_CHAIN)', {
      chainId, stale: base.symbol, fixedTo: derivedSymbol,
    } as any);
  }
  return next;
}

/* ────────────────────────────────────────────────────────────────────────── *
 *                  Overwrite detector (opt-in diagnostic)
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Call right after you write into state to detect accidental overwrites.
 * Only logs when a mismatch occurs.
 */
export function detectNetworkOverwrite(label: string, resolved: NetworkElement, written: any) {
  if (!DEBUG_ENABLED) return;
  if (resolved?.symbol !== written?.symbol) {
    debugLog.warn?.(`[NetworkHelpers] ${label} symbol overwritten`, {
      resolvedSymbol: resolved?.symbol,
      writtenSymbol: written?.symbol,
      chainId: resolved?.chainId,
    } as any);
  }
}

/* ────────────────────────────────────────────────────────────────────────── *
 *                           Optional debug helper
 * ────────────────────────────────────────────────────────────────────────── */

export const createNetworkJsonList = () => {
  // Keep as a light-weight helper; no alerts/log spam.
  try { return JSON.stringify(rawChainIdList, null, 2); } catch { return '{}'; }
};
