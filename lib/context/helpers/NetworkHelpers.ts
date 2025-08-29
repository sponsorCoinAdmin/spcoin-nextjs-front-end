// File: lib/context/helpers/NetworkHelpers.ts

import type { Address } from 'viem';
import rawChainIdList from '@/resources/data/networks/chainIds.json';
import {
  FEED_TYPE,
  type ExchangeContext,
  type NetworkElement,
  type TokenContract,
  type TradeData,
  type WalletAccount,
} from '@/lib/structure';

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

function getNetworkMeta(chainId: number) {
  return chainIdMap.get(Number(chainId));
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
    case 8453:     return 'https://basescan.org/';
    case 31337:    return 'http://localhost:8545/';
    default:       return '';
  }
};

/* ────────────────────────────────────────────────────────────────────────── *
 *                        NetworkElement construction
 * ────────────────────────────────────────────────────────────────────────── */

export function resolveNetworkElement(
  chainId: number,
  prev?: Partial<NetworkElement> | null
): NetworkElement {
  const prevNet = prev ?? {};

  const derivedName   = getBlockChainName(chainId)    || '';
  const derivedLogo   = getBlockChainLogoURL(chainId) || '';
  const derivedUrl    = getBlockExplorerURL(chainId)  || '';
  const derivedSymbol = getBlockChainSymbol(chainId)  || '';

  // Chain changed → drop stale fields and use fresh ones
  if (prevNet.chainId !== chainId) {
    const next: NetworkElement = {
      connected: prevNet.connected ?? false,
      chainId,
      name:    derivedName,
      symbol:  derivedSymbol,
      logoURL: derivedLogo,
      url:     derivedUrl,
    };
    debugLog.log?.('[resolveNetworkElement] CHAIN_CHANGED', next as any);
    return next;
  }

  // Same chainId → enforce derived values (repair stale)
  const next: NetworkElement = {
    connected: prevNet.connected ?? false,
    chainId,
    name:    derivedName,
    symbol:  derivedSymbol,
    logoURL: derivedLogo,
    url:     derivedUrl,
  };

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

  debugLog.log?.('[resolveNetworkElement] SAME_CHAIN', next as any);
  return next;
}

/* ────────────────────────────────────────────────────────────────────────── *
 *                      Merged from lib/network/utils.tsx
 *            (asset logos, constants, comparisons, misc helpers)
 * ────────────────────────────────────────────────────────────────────────── */

// constants
export const BURN_ADDRESS: Address  = '0x0000000000000000000000000000000000000000';
export const NATIVE_TOKEN_ADDRESS: Address = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// images / static asset paths
export const defaultMissingImage = '/assets/miscellaneous/QuestionBlackOnRed.png';
export const badTokenAddressImage = '/assets/miscellaneous/badTokenAddressImage.png';

// minimal existence cache for client-side image checks
const logoExistenceCache = new Map<string, boolean>();

async function resourceExists(url: string, timeoutMs = 2500): Promise<boolean> {
  if (typeof window === 'undefined') return true; // avoid SSR fetch
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    let res = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
    clearTimeout(t);
    if (res.ok) return true;
    if (res.status === 405) {
      res = await fetch(url, { method: 'GET', cache: 'no-store' });
      return res.ok;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Resolve an asset logo path and verify existence (client-side).
 * Uses chainId only for building the asset path; does not read network metadata.
 */
export async function getLogoURL(
  chainId: number | undefined,
  address: Address,
  dataFeedType: FEED_TYPE
): Promise<string> {
  const addr = (address ?? '').trim();
  if (!addr) return defaultMissingImage;

  const path =
    dataFeedType === FEED_TYPE.TOKEN_LIST
      ? `/assets/blockchains/${chainId ?? 1}/contracts/${addr}/logo.png`
      : dataFeedType === FEED_TYPE.RECIPIENT_ACCOUNTS || dataFeedType === FEED_TYPE.AGENT_ACCOUNTS
        ? `/assets/accounts/${addr}/logo.png`
        : '';

  if (!path) return defaultMissingImage;

  if (logoExistenceCache.has(path)) {
    return logoExistenceCache.get(path)! ? path : defaultMissingImage;
  }

  const ok = await resourceExists(path);
  logoExistenceCache.set(path, ok);
  return ok ? path : defaultMissingImage;
}

export type RequiredAssetMembers = { address: string; chainId: number };

export function getTokenLogoURL(required?: RequiredAssetMembers): string {
  if (!required) return badTokenAddressImage;
  const { chainId, address } = required;
  // shallow sanity; viem's isAddress is heavier and not needed for static path
  if (typeof address !== 'string' || address.length < 10) return badTokenAddressImage;
  return `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
}

export function getAddressLogoURL(address: string, chainId: number): string {
  if (typeof address === 'string' && address.length > 10) {
    return `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
  }
  return badTokenAddressImage;
}

export function getAccountLogo(account?: WalletAccount): string {
  return account ? `/assets/accounts/${account.address}/logo.png` : defaultMissingImage;
}

// active-account checks (pure predicates; hook lives in client file)
export function isActiveAccountAddress(exchangeContext: ExchangeContext, address?: Address) {
  return !!address && address === exchangeContext?.accounts?.connectedAccount?.address;
}

export function isActiveAccountToken(exchangeContext: ExchangeContext, token: TokenContract) {
  return isActiveAccountAddress(exchangeContext, token.address);
}

export function isActiveAccountSellToken(exchangeContext: ExchangeContext): boolean {
  return !!exchangeContext?.tradeData?.sellTokenContract &&
         isActiveAccountToken(exchangeContext, exchangeContext.tradeData.sellTokenContract);
}

export function isActiveAccountBuyToken(exchangeContext: ExchangeContext): boolean {
  return !!exchangeContext?.tradeData?.buyTokenContract &&
         isActiveAccountToken(exchangeContext, exchangeContext.tradeData.buyTokenContract);
}

// native/burn checks
export const isNativeTokenAddress = (address?: Address): boolean =>
  address === NATIVE_TOKEN_ADDRESS;

export const isNativeToken = (token: TokenContract): boolean =>
  isNativeTokenAddress(token.address);

export const isNativeSellToken = (tradeData: TradeData): boolean =>
  !!tradeData.sellTokenContract && isNativeToken(tradeData.sellTokenContract);

export const isNativeBuyToken = (tradeData: TradeData): boolean =>
  !!tradeData.buyTokenContract && isNativeToken(tradeData.buyTokenContract);

export const isBurnTokenAddress = (address?: Address): boolean =>
  address === BURN_ADDRESS;

export const isBurnToken = (token: TokenContract): boolean =>
  !!token?.address && isBurnTokenAddress(token.address);

// misc
export const isLowerCase = (input: string): boolean => input === input.toLowerCase();

export function delay(ms: number | undefined) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const tokenContractsEqual = (a?: TokenContract, b?: TokenContract): boolean =>
  a?.address === b?.address && a?.symbol === b?.symbol && a?.decimals === b?.decimals;

/* ────────────────────────────────────────────────────────────────────────── *
 *                           Optional debug helper
 * ────────────────────────────────────────────────────────────────────────── */

export const createNetworkJsonList = () => {
  try { return JSON.stringify(rawChainIdList, null, 2); } catch { return '{}'; }
};
