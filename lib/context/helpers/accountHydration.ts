// File: @/lib/context/helpers/accountHydration.ts
'use client';

import type { Address } from 'viem';
import { isAddress } from 'viem';
import type { spCoinAccount } from '@/lib/structure';
import { FEED_TYPE, type FeedData, STATUS } from '@/lib/structure';
import { getJson } from '@/lib/rest/http';
import { getWalletJsonURL, getWalletLogoURL, defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false as const;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ACCOUNT_HYDRATION === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true' || // optional: piggyback existing
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_PROVIDER === 'true';

const debugLog = createDebugLogger('accountHydration', DEBUG_ENABLED, LOG_TIME);

/**
 * Optional discovery override.
 *
 * IMPORTANT:
 * - For browser fetch(), these should be URL paths (e.g. "/assets/accounts/"), not filesystem ("public/assets/...").
 * - If user mistakenly sets "public/assets/accounts/", we normalize it to "/assets/accounts/".
 */
const ENV_ACCOUNT_PATH_RAW = process.env.NEXT_PUBLIC_ACCOUNT_PATH;

// legacy key constant (keeps dot-access out of the file)
const LEGACY_WALLETS_KEY = 'wallets' as const;

/* ----------------------------- types ----------------------------- */

type WalletJson = Partial<spCoinAccount> & {
  balance?: string | number | bigint;
  status?: unknown; // wallet.json may store string values
};

type HydrateOpts = {
  /** If provided, overrides/merges balance (eg from wagmi). */
  balance?: bigint;
  /**
   * If true, uses json.logoURL when present (not recommended).
   * Default false: always derive via getWalletLogoURL().
   */
  allowJsonLogoURL?: boolean;
  /** Optional override for fallback status when metadata missing. */
  fallbackStatus?: STATUS;
};

/* ----------------------------- small utils ----------------------------- */

function isProbablyClient() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function toBigIntSafe(value: unknown): bigint {
  try {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value));
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return BigInt(trimmed);
      if (/^-?\d+$/.test(trimmed)) return BigInt(trimmed);
    }
  } catch {
    /* ignore */
  }
  return 0n;
}

function coerceStatus(raw: unknown): STATUS {
  if (typeof raw === 'string') {
    const v = raw as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (Object.values(STATUS as any).includes(v)) return v as STATUS;
  }
  return STATUS.INFO;
}

function summarizeOut(out: spCoinAccount) {
  return {
    address: out.address,
    name: out.name,
    symbol: out.symbol,
    type: (out as any).type,
    website: (out as any).website,
    descriptionLen: typeof (out as any).description === 'string' ? (out as any).description.length : undefined,
    status: (out as any).status,
    hasLogo: Boolean(out.logoURL),
    balance: typeof (out as any).balance === 'bigint' ? (out as any).balance.toString() : String((out as any).balance ?? ''),
  };
}

/**
 * Normalize an env "base path" into a URL base usable by fetch().
 * Examples:
 *  - "public/assets/accounts/" -> "/assets/accounts/"
 *  - "/assets/accounts"        -> "/assets/accounts/"
 *  - "assets/accounts"         -> "/assets/accounts/"
 */
function normalizeEnvBasePath(raw?: string): string | undefined {
  const s = (raw ?? '').trim();
  if (!s) return undefined;

  // If user accidentally includes "public/", drop it (public is web root)
  let out = s.replace(/\\/g, '/'); // windows slashes -> url slashes
  if (out.startsWith('public/')) out = out.slice('public'.length);
  if (!out.startsWith('/')) out = '/' + out;
  if (!out.endsWith('/')) out += '/';

  // Guard: if they set "/public/assets/..." (rare), also fix
  if (out.startsWith('/public/')) out = out.slice('/public'.length);

  return out;
}

/**
 * Folder naming convention:
 * Your repo uses uppercase "0X..." directories (confirmed by logs).
 */
function toAccountFolderKey(addr: Address): string {
  const a = String(addr).trim();
  // wallet.json folders are "0X..." uppercase
  return a.toUpperCase().replace(/^0X/, '0X');
}

/**
 * If NEXT_PUBLIC_ACCOUNT_PATH is set, build URLs from it.
 * Otherwise fall back to assetHelpers.
 */
function getWalletJsonURL_SSOT(addr: Address): string {
  const base = normalizeEnvBasePath(ENV_ACCOUNT_PATH_RAW);
  if (base) {
    const key = toAccountFolderKey(addr);
    return `${base}${key}/wallet.json`;
  }
  return getWalletJsonURL(addr);
}

function getWalletLogoURL_SSOT(addr: Address): string {
  const base = normalizeEnvBasePath(ENV_ACCOUNT_PATH_RAW);
  if (base) {
    const key = toAccountFolderKey(addr);
    return `${base}${key}/logo.png`;
  }
  return getWalletLogoURL(addr);
}

/* ----------------------------- SSOT fallbacks ----------------------------- */

/** Consistent fallback shape for "not registered / missing wallet.json". */
export function makeWalletFallback(
  addr: Address,
  status: STATUS,
  description: string,
  balance?: bigint,
): spCoinAccount {
  const out: spCoinAccount = {
    address: addr,
    type: 'ERC20_WALLET' as any,
    name: '',
    symbol: '',
    website: '' as any,
    status,
    description: description as any,
    logoURL: getWalletLogoURL_SSOT(addr) || defaultMissingImage,
    balance: typeof balance === 'bigint' ? balance : 0n,
  };

  debugLog.warn?.('[makeWalletFallback]', {
    addr,
    status,
    description,
    balance: (out as any).balance?.toString?.(),
    logoURL: out.logoURL,
    envAccountPath: ENV_ACCOUNT_PATH_RAW ?? null,
    envAccountPathNormalized: normalizeEnvBasePath(ENV_ACCOUNT_PATH_RAW) ?? null,
  });

  return out;
}

/* ----------------------------- main SSOT ----------------------------- */

/**
 * ✅ SSOT: Hydrate a full spCoinAccount from `/public/assets/accounts/<ADDR>/wallet.json`.
 * If NEXT_PUBLIC_ACCOUNT_PATH is present, it is used as the base for discovery.
 */
export async function hydrateAccountFromAddress(
  address: Address,
  opts: HydrateOpts = {},
): Promise<spCoinAccount> {
  const addr = (address ?? '').trim() as Address;

  debugLog.log?.('[hydrateAccountFromAddress] enter', {
    addr,
    isClient: isProbablyClient(),
    allowJsonLogoURL: !!opts.allowJsonLogoURL,
    hasBalanceOverride: typeof opts.balance === 'bigint',
    fallbackStatus: opts.fallbackStatus,
    envAccountPath: ENV_ACCOUNT_PATH_RAW ?? null,
    envAccountPathNormalized: normalizeEnvBasePath(ENV_ACCOUNT_PATH_RAW) ?? null,
  });

  if (!addr || !isAddress(addr)) {
    debugLog.warn?.('[hydrateAccountFromAddress] invalid address', { addr });
    return makeWalletFallback(
      (addr || ('0x0000000000000000000000000000000000000000' as Address)) as Address,
      opts.fallbackStatus ?? STATUS.MESSAGE_ERROR,
      'Invalid wallet address',
      opts.balance,
    );
  }

  if (!isProbablyClient()) {
    debugLog.warn?.('[hydrateAccountFromAddress] SSR guard hit (no fetch)', { addr });
    return makeWalletFallback(
      addr,
      opts.fallbackStatus ?? STATUS.INFO,
      'Wallet metadata available on client only',
      opts.balance,
    );
  }

  const url = getWalletJsonURL_SSOT(addr);
  debugLog.log?.('[hydrateAccountFromAddress] wallet.json URL', { addr, url });

  let json: WalletJson | undefined;
  try {
    json = await getJson<WalletJson>(url, {
      timeoutMs: 6000,
      retries: 1,
      accept: 'application/json',
      init: { cache: 'no-store' },
      forceParse: true,
    });

    debugLog.log?.('[hydrateAccountFromAddress] wallet.json fetched OK', {
      addr,
      url,
      keys: json && typeof json === 'object' ? Object.keys(json).slice(0, 30) : null,
      name: json?.name,
      symbol: json?.symbol,
      type: (json as any)?.type,
      status: (json as any)?.status,
    });
  } catch (err: any) {
    debugLog.warn?.('[hydrateAccountFromAddress] wallet.json fetch FAILED -> fallback', {
      addr,
      url,
      err: String(err?.message ?? err),
    });

    return makeWalletFallback(
      addr,
      opts.fallbackStatus ?? STATUS.MESSAGE_ERROR,
      `Account ${addr} not registered on this site`,
      opts.balance,
    );
  }

  const balance = typeof opts.balance === 'bigint' ? opts.balance : toBigIntSafe(json?.balance);

  // Default: always derive logoURL (filesystem convention)
  const derivedLogo = getWalletLogoURL_SSOT(addr) || defaultMissingImage;
  const logoURL =
    opts.allowJsonLogoURL && typeof (json as any)?.logoURL === 'string' && String((json as any).logoURL).trim().length
      ? String((json as any).logoURL)
      : derivedLogo;

  const out: spCoinAccount = {
    address: addr,
    type: typeof (json as any)?.type === 'string' ? (json as any).type : ('ERC20_WALLET' as any),
    name: typeof json?.name === 'string' ? json.name : '',
    symbol: typeof json?.symbol === 'string' ? json.symbol : '',
    website: typeof (json as any)?.website === 'string' ? (json as any).website : ('' as any),
    description: typeof (json as any)?.description === 'string' ? (json as any).description : ('' as any),
    status: coerceStatus((json as any)?.status),
    logoURL,
    balance,
  };

  debugLog.log?.('[hydrateAccountFromAddress] exit (hydrated)', summarizeOut(out));

  return out;
}

/* ----------------------------- (ex-builders) feed building ----------------------------- */

function normalizeList(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    // legacy inputs (INPUT ONLY)
    if (Array.isArray((raw as any)[LEGACY_WALLETS_KEY])) return (raw as any)[LEGACY_WALLETS_KEY];

    // common wrappers
    if (Array.isArray((raw as any).items)) return (raw as any).items;
    if (Array.isArray((raw as any).accounts)) return (raw as any).accounts;
    if (Array.isArray((raw as any).recipients)) return (raw as any).recipients;
    if (Array.isArray((raw as any).agents)) return (raw as any).agents;
    if (Array.isArray((raw as any).sponsors)) return (raw as any).sponsors;
    if (Array.isArray((raw as any).tokens)) return (raw as any).tokens;
  }
  return [];
}

function pickAddressFromSpec(spec: any): Address | undefined {
  if (!spec) return undefined;
  if (typeof spec === 'string' && isAddress(spec)) return spec as Address;
  if (typeof spec === 'object') {
    const a = (spec.address ?? spec.addr ?? spec.id) as unknown;
    if (typeof a === 'string' && isAddress(a)) return a as Address;
  }
  return undefined;
}

/**
 * Build a spCoinAccount from a JSON "spec" entry using SSOT hydration.
 * - If spec has an address: hydrate from wallet.json and overlay any inline fields.
 * - If no valid address: returns a consistent fallback (error status).
 */
async function buildAccountFromJsonSpec(spec: any): Promise<spCoinAccount> {
  const addr = pickAddressFromSpec(spec);

  const balanceOverride =
    typeof spec === 'object' && spec
      ? (typeof spec.balance === 'bigint' ? spec.balance : toBigIntSafe(spec.balance))
      : undefined;

  if (!addr) {
    return makeWalletFallback(
      '0x0000000000000000000000000000000000000000' as Address,
      STATUS.MESSAGE_ERROR,
      'Invalid wallet address',
      balanceOverride,
    );
  }

  const hydrated = await hydrateAccountFromAddress(addr, {
    balance: typeof balanceOverride === 'bigint' ? balanceOverride : undefined,
    // allow JSON to override logo only if explicitly requested elsewhere; keep default false.
    allowJsonLogoURL: false,
  });

  // Overlay any inline/user-provided fields without breaking SSOT fields unless explicitly present.
  if (spec && typeof spec === 'object') {
    const out: spCoinAccount = {
      ...hydrated,
      // allow common overrides if provided (eg in manage JSON)
      name: typeof spec.name === 'string' ? spec.name : hydrated.name,
      symbol: typeof spec.symbol === 'string' ? spec.symbol : hydrated.symbol,
      website: typeof spec.website === 'string' ? spec.website : (hydrated as any).website,
      description: typeof spec.description === 'string' ? spec.description : (hydrated as any).description,
      status: spec.status ? coerceStatus(spec.status) : (hydrated as any).status,
      balance: typeof balanceOverride === 'bigint' ? balanceOverride : (hydrated as any).balance,
    };

    // if they provided an explicit logoURL in spec, keep it (rare, but manage json sometimes needs it)
    if (typeof spec.logoURL === 'string' && spec.logoURL.trim().length) out.logoURL = spec.logoURL.trim();

    return out;
  }

  return hydrated;
}

/**
 * Replacement for builders.buildTokenFromJson.
 * Keep it permissive: pass through JSON with chainId attached (if absent).
 */
export function buildTokenFromJson(tokenJson: any, chainId: number) {
  if (!tokenJson || typeof tokenJson !== 'object') return null;
  const out: any = { ...tokenJson };
  if (out.chainId == null) out.chainId = chainId;
  return out;
}

/**
 * Replacement for builders.buildWalletFromJsonFirst.
 */
export async function buildWalletFromJsonFirst(raw: any): Promise<spCoinAccount | null> {
  const list = normalizeList(raw);
  const first = list[0];
  if (!first) return null;
  return buildAccountFromJsonSpec(first);
}

/**
 * Replacement for builders.feedDataFromJson.
 *
 * ✅ HARD RULE: account feeds return `spCoinAccounts`.
 * Tokens return `tokens`.
 */
export async function feedDataFromJson(feedType: FEED_TYPE, chainId: number, raw: any): Promise<FeedData> {
  switch (feedType) {
    case FEED_TYPE.TOKEN_LIST: {
      const list = normalizeList(raw);
      const tokens = list.map((t) => buildTokenFromJson(t, chainId)).filter(Boolean);
      return { tokens } as any;
    }

    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS:
    case FEED_TYPE.SPONSOR_ACCOUNTS:
    case FEED_TYPE.MANAGE_RECIPIENTS:
    case FEED_TYPE.MANAGE_AGENTS: {
      const list = normalizeList(raw);
      const spCoinAccounts = await Promise.all(list.map((x) => buildAccountFromJsonSpec(x)));
      return { spCoinAccounts } as any;
    }

    default: {
      // permissive fallback: try accounts first, else tokens
      const list = normalizeList(raw);
      const spCoinAccounts = await Promise.all(list.map((x) => buildAccountFromJsonSpec(x)));
      return { spCoinAccounts } as any;
    }
  }
}
