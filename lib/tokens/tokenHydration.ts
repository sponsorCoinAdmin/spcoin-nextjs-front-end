import type { Address } from 'viem';
import { isAddress } from '@/lib/utils/address';

import { defaultMissingImage, getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';
import {
  loadTokenRecord,
  loadTokenRecordsBatch,
} from '@/lib/context/tokens/tokenStore';
import type { TokenContract, TokenExternalLink } from '@/lib/structure';

const ENV_TOKEN_PATH_RAW = process.env.NEXT_PUBLIC_TOKEN_PATH;
const NATIVE_ETH_PLACEHOLDER = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const TOKEN_BATCH_PAGE_SIZE = 25;
const NA_VALUE = 'N/A';

function normalizeEnvBasePath(raw?: string): string | undefined {
  const s = (raw ?? '').trim();
  if (!s) return undefined;

  let out = s.replace(/\\/g, '/');
  if (out.startsWith('public/')) out = out.slice('public'.length);
  if (!out.startsWith('/')) out = '/' + out;
  if (!out.endsWith('/')) out += '/';
  if (out.startsWith('/public/')) out = out.slice('/public'.length);

  return out;
}

function normalizeAddressLower(value: string): Address {
  return (`0x${value.slice(2).toLowerCase()}`) as Address;
}

function toTokenFolderKey(addr: Address): string {
  const a = String(addr).trim();
  return a.toUpperCase().replace(/^0X/, '0X');
}

function chunk<T>(arr: readonly T[], size: number): T[][] {
  if (size <= 0) return [arr.slice() as T[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size) as T[]);
  return out;
}

export function getTokenInfoURL_SSOT(
  chainId: number,
  addr: Address,
): string | undefined {
  const base = normalizeEnvBasePath(ENV_TOKEN_PATH_RAW);
  if (!base) return undefined;
  const key = toTokenFolderKey(addr);
  return `${base}${chainId}/contracts/${key}/info.json`;
}

export function getTokenLogoURL_SSOT(
  chainId: number,
  addr: Address,
): string | undefined {
  const base = normalizeEnvBasePath(ENV_TOKEN_PATH_RAW);
  if (!base) {
    return getTokenLogoURL({ chainId, address: addr }) ?? undefined;
  }
  const key = toTokenFolderKey(addr);
  return `${base}${chainId}/contracts/${key}/logo.png`;
}

interface TokenJsonInput {
  address?: unknown;
  addr?: unknown;
  name?: unknown;
  symbol?: unknown;
  decimals?: unknown;
  logoURL?: unknown;
  logoURI?: unknown;
  infoURL?: unknown;
  website?: unknown;
  description?: unknown;
  explorer?: unknown;
  links?: unknown;
  coin_type?: unknown;
  research?: unknown;
  rpc_url?: unknown;
  tags?: unknown;
  chainId?: unknown;
  __invalid?: unknown;
  [key: string]: unknown;
}

function asTrimmedString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function asNAString(value: unknown): string {
  return asTrimmedString(value) ?? NA_VALUE;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  return out.length > 0 ? out : undefined;
}

function asExternalLinks(value: unknown): TokenExternalLink[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const links: TokenExternalLink[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as { name?: unknown; url?: unknown };
    const name = asTrimmedString(item.name);
    const url = asTrimmedString(item.url);
    if (name && url) links.push({ name, url });
  }
  return links.length > 0 ? links : undefined;
}

function applyTokenMetadata(out: TokenJsonInput): void {
  out.name = asNAString(out.name);
  out.symbol = asNAString(out.symbol);
  out.website = asNAString(out.website);
  out.description = asNAString(out.description);
  out.explorer = asNAString(out.explorer);
  out.research = asNAString(out.research);
  out.rpc_url = asNAString(out.rpc_url);
  out.decimals = asNumber(out.decimals) ?? 0;
  out.coin_type = asNumber(out.coin_type) ?? 0;
  out.tags = asStringArray(out.tags) ?? [];
  out.links = asExternalLinks(out.links) ?? [];
}

export async function hydrateTokenFromAddress(
  chainId: number,
  address: Address,
): Promise<TokenContract> {
  const addr = (address ?? '').trim() as Address;

  if (addr.toLowerCase() === NATIVE_ETH_PLACEHOLDER.toLowerCase()) {
    return {
      address: addr,
      chainId,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      logoURL: defaultMissingImage,
      balance: 0n,
    };
  }

  try {
    const record = await loadTokenRecord(chainId, addr);

    return {
      address: addr,
      chainId,
      name: asNAString(record?.name),
      symbol: asNAString(record?.symbol),
      decimals:
        typeof record?.decimals === 'number' ? record.decimals : 0,
      logoURL:
        typeof record?.logoURL === 'string' && record.logoURL.trim().length
          ? record.logoURL
          : getTokenLogoURL_SSOT(chainId, addr) ?? defaultMissingImage,
      website: asNAString((record as { website?: unknown }).website),
      description: asNAString((record as { description?: unknown }).description),
      explorer: asNAString((record as { explorer?: unknown }).explorer),
      research: asNAString((record as { research?: unknown }).research),
      rpc_url: asNAString((record as { rpc_url?: unknown }).rpc_url),
      coin_type: asNumber((record as { coin_type?: unknown }).coin_type) ?? 0,
      links: asExternalLinks((record as { links?: unknown }).links) ?? [],
      tags: asStringArray((record as { tags?: unknown }).tags) ?? [],
      balance: 0n,
    };
  } catch {
    const logoURL = getTokenLogoURL_SSOT(chainId, addr) ?? defaultMissingImage;
    return {
      address: addr,
      chainId,
      name: NA_VALUE,
      symbol: NA_VALUE,
      decimals: 0,
      logoURL,
      website: NA_VALUE,
      description: NA_VALUE,
      explorer: NA_VALUE,
      research: NA_VALUE,
      rpc_url: NA_VALUE,
      coin_type: 0,
      links: [],
      tags: [],
      balance: 0n,
    };
  }
}

export function buildTokenFromJson(
  tokenJson: unknown,
  chainId: number,
  contextAddress?: Address,
): TokenJsonInput {
  const tokenObj: TokenJsonInput =
    tokenJson && typeof tokenJson === 'object' ? (tokenJson as TokenJsonInput) : {};
  const rawAddr =
    typeof tokenJson === 'string'
      ? tokenJson
      : tokenObj.address ?? tokenObj.addr ?? contextAddress ?? '';

  const addr =
    typeof rawAddr === 'string'
      ? rawAddr.trim()
      : typeof rawAddr === 'number' ||
          typeof rawAddr === 'bigint' ||
          typeof rawAddr === 'boolean'
        ? String(rawAddr).trim()
        : '';

  if (!addr || !isAddress(addr)) {
    const fallbackName =
      typeof tokenObj.name === 'string'
        ? tokenObj.name
        : 'Invalid token address';

    const fallbackSymbol =
      typeof tokenObj.symbol === 'string'
        ? tokenObj.symbol
        : 'INVALID';

    return {
      address: addr || '(empty)',
      chainId,
      name: fallbackName,
      symbol: fallbackSymbol,
      decimals: undefined,
      logoURL: defaultMissingImage,
      __invalid: true,
    };
  }

  const out: TokenJsonInput = {
    ...tokenObj,
    address: addr,
    chainId,
  };

  const explicitLogo =
    typeof out.logoURL === 'string' && out.logoURL.trim().length
      ? out.logoURL.trim()
      : typeof out.logoURI === 'string' && out.logoURI.trim().length
        ? out.logoURI.trim()
        : undefined;

  out.logoURL =
    explicitLogo ?? getTokenLogoURL_SSOT(chainId, addr as Address) ?? defaultMissingImage;
  out.infoURL ??= getTokenInfoURL_SSOT(chainId, addr as Address);
  applyTokenMetadata(out);

  return out;
}

export async function hydrateTokensFromAddressesBatch(
  chainId: number,
  addresses: Address[],
): Promise<Map<string, unknown>> {
  const uniqueAddresses = Array.from(
    new Set(addresses.map((a) => normalizeAddressLower(a))),
  );
  if (!uniqueAddresses.length) return new Map<string, unknown>();

  const pages = chunk(uniqueAddresses, TOKEN_BATCH_PAGE_SIZE);
  const out = new Map<string, unknown>();

  await Promise.all(
    pages.map(async (page) => {
      try {
        const records = await loadTokenRecordsBatch(
          page.map((address) => ({ chainId, address })),
        );

        for (const item of records) {
          const rawAddr = item?.address;
          if (typeof rawAddr !== 'string' || !isAddress(rawAddr)) continue;
          out.set(normalizeAddressLower(rawAddr).toLowerCase(), item ?? null);
        }
      } catch {
        // Keep prior behavior by leaving unresolved tokens absent.
      }
    }),
  );

  return out;
}
