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
      `[getNetworkMeta] No chain meta for chainId=${key} — check resources/data/networks/chainIds.json`
    );
    return undefined;
  }
  if (!meta.name) debugLog.warn?.(`[getNetworkMeta] Missing 'name' for chainId=${key}`);
  if (!meta.symbol) debugLog.warn?.(`[getNetworkMeta] Missing 'symbol' for chainId=${key} (${meta.name ?? 'Unknown'})`);
  debugLog.log?.('[getNetworkMeta] found meta', { chainId: key, ...meta } as any);
  return meta;
}

/* ────────────────────────────────────────────────────────────────────────── *
 *                             Public network getters
 * ────────────────────────────────────────────────────────────────────────── */

export const getBlockChainLogoURL = (chainId: number): string =>
  `/assets/blockchains/${chainId}/info/network.png`;

export const getBlockChainName = (chainId: number): string | undefined => {
  const name = getNetworkMeta(chainId)?.name;
  debugLog.log?.('[getBlockChainName]', { chainId, name } as any);
  return name;
};

export const getBlockChainSymbol = (chainId: number): string | undefined => {
  const symbol = getNetworkMeta(chainId)?.symbol;
  debugLog.log?.('[getBlockChainSymbol]', { chainId, symbol } as any);
  return symbol;
};

export const getBlockExplorerURL = (chainId: number): string => {
  const url = (() => {
    switch (chainId) {
      case 1:        return 'https://etherscan.io/';
      case 5:        return 'https://goerli.etherscan.io/';
      case 137:      return 'https://polygonscan.com/';
      case 80001:    return 'https://mumbai.polygonscan.com/';
      case 11155111: return 'https://sepolia.etherscan.io/';
      case 8453:     return 'https://basescan.org/';            // ✅ BASE
      case 31337:    return 'http://localhost:8545/';
      default:       return '';
    }
  })();
  debugLog.log?.('[getBlockExplorerURL]', { chainId, url } as any);
  return url;
};

/* ────────────────────────────────────────────────────────────────────────── *
 *                        NetworkElement construction
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Build or update a NetworkElement for a given chainId.
 * If `prev` has the same chainId, we only backfill missing fields — BUT we also
 * REPAIR any stale fields to the correct derived values.
 */
export function resolveNetworkElement(
  chainId: number,
  prev?: Partial<NetworkElement> | null
): NetworkElement {
  const prevNet = prev ?? {};
  debugLog.log?.('[resolveNetworkElement] ENTRY', { chainId, prevNet } as any);

  const derivedName   = getBlockChainName(chainId)    || '';
  const derivedLogo   = getBlockChainLogoURL(chainId) || '';
  const derivedUrl    = getBlockExplorerURL(chainId)  || '';
  const derivedSymbol = getBlockChainSymbol(chainId)  || '';

  debugLog.log?.('[resolveNetworkElement] DERIVED', {
    chainId, derivedName, derivedSymbol, derivedLogo, derivedUrl,
  } as any);

  if (prevNet.chainId !== chainId) {
    // Chain changed → drop stale fields and use fresh ones
    const next: NetworkElement = {
      connected: prevNet.connected ?? false,
      chainId,
      name:    derivedName,
      symbol:  derivedSymbol,
      logoURL: derivedLogo,
      url:     derivedUrl,
    };
    debugLog.log?.('[resolveNetworkElement] CHAIN_CHANGED → returning NEW object', next as any);
    return next;
  }

  // Same chainId → enforce derived values (repair stale), but keep "connected"
  const next: NetworkElement = {
    connected: prevNet.connected ?? false,
    chainId,
    name:    derivedName,   // ✅ always enforce
    symbol:  derivedSymbol, // ✅ always enforce
    logoURL: derivedLogo,   // ✅ always enforce
    url:     derivedUrl,    // ✅ always enforce
  };

  // Log if we repaired anything stale
  if (prevNet.name && prevNet.name !== derivedName) {
    debugLog.warn?.('[resolveNetworkElement] Repaired stale name', {
      chainId, stale: prevNet.name, fixedTo: derivedName,
    } as any);
  }
  if (prevNet.symbol && prevNet.symbol !== derivedSymbol) {
    debugLog.warn?.('[resolveNetworkElement] Repaired stale symbol', {
      chainId, stale: prevNet.symbol, fixedTo: derivedSymbol,
    } as any);
  }
  if (prevNet.logoURL && prevNet.logoURL !== derivedLogo) {
    debugLog.warn?.('[resolveNetworkElement] Repaired stale logoURL', {
      chainId, stale: prevNet.logoURL, fixedTo: derivedLogo,
    } as any);
  }
  if (prevNet.url && prevNet.url !== derivedUrl) {
    debugLog.warn?.('[resolveNetworkElement] Repaired stale url', {
      chainId, stale: prevNet.url, fixedTo: derivedUrl,
    } as any);
  }

  debugLog.log?.('[resolveNetworkElement] SAME_CHAIN → computed NEXT', next as any);
  debugLog.log?.('[resolveNetworkElement] FIELD_DIFFS', {
    nameChanged: prevNet.name !== next.name,
    symbolChanged: prevNet.symbol !== next.symbol,
    logoChanged: prevNet.logoURL !== next.logoURL,
    urlChanged: prevNet.url !== next.url,
    anyChanged:
      prevNet.name !== next.name ||
      prevNet.symbol !== next.symbol ||
      prevNet.logoURL !== next.logoURL ||
      prevNet.url !== next.url,
  } as any);

  return next;
}

/* ────────────────────────────────────────────────────────────────────────── *
 *                           Optional debug helper
 * ────────────────────────────────────────────────────────────────────────── */

export const createNetworkJsonList = () => {
  try { return JSON.stringify(rawChainIdList, null, 2); } catch { return '{}'; }
};
