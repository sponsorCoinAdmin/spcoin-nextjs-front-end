// File: @/lib/context/helpers/NetworkHelpers.ts
import rawChainIdList from '@/resources/data/networks/chainIds.json';
import type { NetworkElement } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_UTILS === 'true';
const debugLog = createDebugLogger('NetworkHelpers', DEBUG_ENABLED, /* timestamp */ false);

/* ────────────────────────────────────────────────────────────────────────── *
 *                         Chain list normalization / map
 * ────────────────────────────────────────────────────────────────────────── */

type ChainMeta = { chainId?: number | string; name?: string; symbol?: string };

const chainIdMap: Record<number, { name: string; symbol: string }> = (() => {
  const list: ChainMeta[] = Array.isArray((rawChainIdList as any)?.default)
    ? (rawChainIdList as any).default
    : Array.isArray(rawChainIdList)
      ? (rawChainIdList as any)
      : [];
  const obj: Record<number, { name: string; symbol: string }> = {};
  for (const e of list) {
    const id = Number(e.chainId);
    if (!Number.isFinite(id)) continue;
    obj[id] = {
      name: String(e?.name ?? '').trim(),
      symbol: String(e?.symbol ?? '').trim(),
    };
  }
  return obj;
})();

const getMeta = (chainId: number) => chainIdMap[Number(chainId)];

/* ────────────────────────────────────────────────────────────────────────── *
 *                             Public network getters
 * ────────────────────────────────────────────────────────────────────────── */

export const getBlockChainLogoURL = (chainId: number): string =>
  `/assets/blockchains/${chainId}/info/network.png`;

export const getBlockChainName = (chainId: number): string | undefined =>
  getMeta(chainId)?.name;

export const getBlockChainSymbol = (chainId: number): string | undefined =>
  getMeta(chainId)?.symbol;

// Data-driven explorer map keyed by CHAIN_ID (no magic numbers)
const BLOCK_EXPLORER_URL: Record<CHAIN_ID, string> = {
  [CHAIN_ID.ETHEREUM]: 'https://etherscan.io/',
  [CHAIN_ID.GOERLI]:   'https://goerli.etherscan.io/',
  [CHAIN_ID.POLYGON]:  'https://polygonscan.com/',
  [CHAIN_ID.BASE]:     'https://basescan.org/',
  [CHAIN_ID.HARDHAT]:  'http://localhost:8545/',
  [CHAIN_ID.MUMBAI]:   'https://mumbai.polygonscan.com/',
  [CHAIN_ID.SEPOLIA]:  'https://sepolia.etherscan.io/',
};

export const getBlockExplorerURL = (chainId: number): string =>
  BLOCK_EXPLORER_URL[chainId as CHAIN_ID] ?? '';

/* ────────────────────────────────────────────────────────────────────────── *
 *                        NetworkElement construction
 * ────────────────────────────────────────────────────────────────────────── */

const CHAIN_DERIVED: Array<keyof NetworkElement> = ['name', 'symbol', 'logoURL', 'url'];

export function networkEquals(a?: NetworkElement | null, b?: NetworkElement | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.chainId !== b.chainId) return false;
  for (const k of CHAIN_DERIVED) if ((a as any)[k] !== (b as any)[k]) return false;
  if (a.connected !== b.connected) return false;
  return true;
}

/**
 * Canonicalize a NetworkElement for a given *wallet* chainId.
 * NOTE: This keeps the older behavior for callers that rely on it.
 */
export function resolveNetworkElement(
  chainId: number,
  prev?: Partial<NetworkElement> | null
): NetworkElement {
  const prevNet = (prev ?? null) as NetworkElement | null;
  const prevId = prevNet?.chainId;

  const next: NetworkElement = {
    connected: !!prevNet?.connected,
    appChainId: prevNet?.appChainId ?? 0, // preserve current app selection
    chainId,
    name:    getBlockChainName(chainId)    || '',
    symbol:  getBlockChainSymbol(chainId)  || '',
    logoURL: getBlockChainLogoURL(chainId),
    url:     getBlockExplorerURL(chainId),
  };

  if (prevNet && networkEquals(prevNet, next)) return prevNet;

  if (DEBUG_ENABLED && typeof prevId === 'number' && prevId !== chainId) {
    debugLog.log?.('[resolveNetworkElement] WALLET_CHAIN_CHANGED', {
      from: prevId,
      to: chainId,
      name: next.name,
      symbol: next.symbol,
      url: next.url,
      logoURL: next.logoURL,
    } as any);
  }
  return next;
}

/**
 * ✅ Derive app-driven network metadata from `appChainId` ONLY.
 * - Updates: appChainId, name, symbol, logoURL, url
 * - Preserves: connected, wallet chainId
 */
export function deriveNetworkFromApp(
  appChainId: number,
  prev?: Partial<NetworkElement> | null
): NetworkElement {
  const prevNet = (prev ?? null) as NetworkElement | null;

  const next: NetworkElement = {
    connected: !!prevNet?.connected,
    chainId:   prevNet?.chainId ?? 0, // preserve wallet id
    appChainId,
    name:    getBlockChainName(appChainId)    || '',
    symbol:  getBlockChainSymbol(appChainId)  || '',
    logoURL: getBlockChainLogoURL(appChainId),
    url:     getBlockExplorerURL(appChainId),
  };

  // If nothing substantive changed, return prev to avoid re-renders
  if (
    prevNet &&
    prevNet.appChainId === next.appChainId &&
    prevNet.name === next.name &&
    prevNet.symbol === next.symbol &&
    prevNet.logoURL === next.logoURL &&
    prevNet.url === next.url
  ) {
    return prevNet;
  }

  if (DEBUG_ENABLED) {
    debugLog.log?.('[deriveNetworkFromApp] APP_CHAIN_CHANGED', {
      from: prevNet?.appChainId,
      to: appChainId,
      name: next.name,
      symbol: next.symbol,
      url: next.url,
      logoURL: next.logoURL,
    } as any);
  }
  return next;
}

/* ────────────────────────────────────────────────────────────────────────── *
 *                 (Optional) Compatibility default export
 * ────────────────────────────────────────────────────────────────────────── */

const NetworkHelpers = {
  getBlockChainName,
  getBlockChainLogoURL,
  getBlockChainSymbol,
  getBlockExplorerURL,
  resolveNetworkElement,
  deriveNetworkFromApp,
  networkEquals,
};

export default NetworkHelpers;
