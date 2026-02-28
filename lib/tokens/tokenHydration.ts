import type { Address } from 'viem';
import { isAddress } from 'viem';

import { defaultMissingImage, getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';
import {
  loadTokenRecord,
  loadTokenRecordsBatch,
} from '@/lib/context/tokens/tokenStore';

const ENV_TOKEN_PATH_RAW = process.env.NEXT_PUBLIC_TOKEN_PATH;
const NATIVE_ETH_PLACEHOLDER = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const TOKEN_BATCH_PAGE_SIZE = 25;

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

export async function hydrateTokenFromAddress(
  chainId: number,
  address: Address,
) {
  const addr = (address ?? '').trim() as Address;

  if (addr.toLowerCase() === NATIVE_ETH_PLACEHOLDER.toLowerCase()) {
    return {
      address: addr,
      chainId,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      logoURL: defaultMissingImage,
    } as any;
  }

  try {
    const record = await loadTokenRecord(chainId, addr);

    return {
      address: addr,
      chainId,
      name: typeof record?.name === 'string' ? record.name : '',
      symbol: typeof record?.symbol === 'string' ? record.symbol : '',
      decimals:
        typeof record?.decimals === 'number' ? record.decimals : undefined,
      logoURL:
        typeof record?.logoURL === 'string' && record.logoURL.trim().length
          ? record.logoURL
          : getTokenLogoURL_SSOT(chainId, addr) ?? defaultMissingImage,
    } as any;
  } catch {
    const logoURL = getTokenLogoURL_SSOT(chainId, addr) ?? defaultMissingImage;
    return {
      address: addr,
      chainId,
      name: '',
      symbol: '',
      decimals: undefined,
      logoURL,
    } as any;
  }
}

export function buildTokenFromJson(tokenJson: any, chainId: number) {
  const rawAddr =
    typeof tokenJson === 'string'
      ? tokenJson
      : tokenJson && typeof tokenJson === 'object'
        ? (tokenJson.address ?? tokenJson.id ?? tokenJson.addr)
        : '';

  const addr =
    typeof rawAddr === 'string'
      ? rawAddr.trim()
      : String(rawAddr ?? '').trim();

  if (!addr || !isAddress(addr)) {
    const fallbackName =
      tokenJson &&
      typeof tokenJson === 'object' &&
      typeof tokenJson.name === 'string'
        ? tokenJson.name
        : 'Invalid token address';

    const fallbackSymbol =
      tokenJson &&
      typeof tokenJson === 'object' &&
      typeof tokenJson.symbol === 'string'
        ? tokenJson.symbol
        : 'INVALID';

    return {
      address: addr || '(empty)',
      chainId,
      name: fallbackName,
      symbol: fallbackSymbol,
      decimals: undefined,
      logoURL: defaultMissingImage,
      __invalid: true,
    } as any;
  }

  const out: any = {
    ...(tokenJson && typeof tokenJson === 'object' ? tokenJson : {}),
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
    explicitLogo ??
    getTokenLogoURL_SSOT(chainId, addr as Address) ??
    defaultMissingImage;
  if (out.infoURL == null) {
    out.infoURL = getTokenInfoURL_SSOT(chainId, addr as Address);
  }

  return out;
}

export async function hydrateTokensFromAddressesBatch(
  chainId: number,
  addresses: Address[],
): Promise<Map<string, any>> {
  const uniqueAddresses = Array.from(
    new Set(addresses.map((a) => normalizeAddressLower(a))),
  );
  if (!uniqueAddresses.length) return new Map<string, any>();

  const pages = chunk(uniqueAddresses, TOKEN_BATCH_PAGE_SIZE);
  const out = new Map<string, any>();

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
