// File: app/api/spCoin/tokens/route.ts
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

import baseTokenListRaw from '@/resources/data/networks/base/tokenList.json';
import ethereumTokenListRaw from '@/resources/data/networks/ethereum/tokenList.json';
import hardhatTokenListRaw from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenListRaw from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenListRaw from '@/resources/data/networks/sepolia/tokenList.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKENS_DIR = path.join(process.cwd(), 'public', 'assets', 'blockchains');
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

type TokenRequestRow = {
  chainId: number;
  address: string;
};

type TokenResponseRow = {
  chainId: number;
  address: string;
  data: unknown;
};

type BatchRequest = {
  chainId?: number;
  addresses?: string[];
  requests?: Array<{
    chainId?: number;
    address?: string;
  }>;
};

const TOKEN_LISTS_BY_CHAIN: Record<number, string[]> = {
  1: ethereumTokenListRaw as string[],
  137: polygonTokenListRaw as string[],
  8453: baseTokenListRaw as string[],
  31337: hardhatTokenListRaw as string[],
  11155111: sepoliaTokenListRaw as string[],
};

function toBoolean(value: string | null): boolean {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function toInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isAddress(value: string): boolean {
  return /^0[xX][0-9a-fA-F]{40}$/.test(value);
}

function normalizeAddress(value: string): string {
  return `0x${value.slice(2).toLowerCase()}`;
}

function toFolderName(normalizedAddress: string): string {
  return `0X${normalizedAddress.slice(2).toUpperCase()}`;
}

function normalizeAndValidateAddress(value: string): string | null {
  const trimmed = value.trim();
  if (!isAddress(trimmed)) return null;
  return normalizeAddress(trimmed);
}

function normalizeAddressList(raw: string[]): string[] {
  const normalized = raw
    .map((entry) => (typeof entry === 'string' ? normalizeAndValidateAddress(entry) : null))
    .filter((entry): entry is string => entry !== null);
  return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
}

function getConfiguredChainIds(): number[] {
  return Object.keys(TOKEN_LISTS_BY_CHAIN)
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x))
    .sort((a, b) => a - b);
}

function getSeedAddressesForChain(chainId: number): string[] {
  const list = TOKEN_LISTS_BY_CHAIN[chainId] ?? [];
  return normalizeAddressList(list);
}

function parseChainIds(url: URL): number[] {
  const allNetworks = toBoolean(url.searchParams.get('allNetworks'));
  if (allNetworks) return getConfiguredChainIds();

  const chainId = toInt(url.searchParams.get('chainId'), -1);
  if (!Number.isFinite(chainId) || chainId <= 0) return [];
  return [chainId];
}

function flattenRequests(chainIds: number[]): TokenRequestRow[] {
  const rows: TokenRequestRow[] = [];
  for (const chainId of chainIds) {
    for (const address of getSeedAddressesForChain(chainId)) {
      rows.push({ chainId, address });
    }
  }
  return rows;
}

async function loadTokenData(chainId: number, normalizedAddress: string): Promise<TokenResponseRow | null> {
  const folder = toFolderName(normalizedAddress);
  const infoPath = path.join(
    TOKENS_DIR,
    String(chainId),
    'contracts',
    folder,
    'info.json',
  );
  const logoPath = path.join(
    TOKENS_DIR,
    String(chainId),
    'contracts',
    folder,
    'logo.png',
  );

  try {
    const raw = await fs.readFile(infoPath, 'utf8');
    const info = JSON.parse(raw);
    let hasLogo = false;
    try {
      await fs.access(logoPath);
      hasLogo = true;
    } catch {
      hasLogo = false;
    }

    return {
      chainId,
      address: normalizedAddress,
      data: {
        ...info,
        address: normalizedAddress,
        chainId,
        logoURL: hasLogo
          ? `/assets/blockchains/${chainId}/contracts/${folder}/logo.png`
          : (info?.logoURL ?? undefined),
      },
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const allData = toBoolean(url.searchParams.get('allData'));
  const page = Math.max(1, toInt(url.searchParams.get('page'), DEFAULT_PAGE));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, toInt(url.searchParams.get('pageSize'), DEFAULT_PAGE_SIZE)),
  );
  const chainIds = parseChainIds(url);
  const addressParam = url.searchParams.get('address');

  if (!chainIds.length) {
    return NextResponse.json(
      { error: 'Provide either chainId=<number> or allNetworks=true.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (addressParam) {
    const normalizedAddress = normalizeAndValidateAddress(addressParam);
    if (!normalizedAddress) {
      return NextResponse.json(
        { error: 'Invalid address query parameter. Expected 0x + 40 hex chars.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const rows = await Promise.all(
      chainIds.map((chainId) => loadTokenData(chainId, normalizedAddress)),
    );
    const found = rows.filter((row): row is TokenResponseRow => row !== null);
    if (!found.length) {
      return NextResponse.json(
        {
          error: 'Token not found',
          address: normalizedAddress,
          chainIds,
        },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (found.length === 1) {
      return NextResponse.json(found[0], {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    return NextResponse.json(
      { items: found, countFound: found.length },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const requestRows = flattenRequests(chainIds);
    if (!allData) {
      if (chainIds.length === 1) {
        return NextResponse.json(
          requestRows.map((x) => x.address),
          { status: 200, headers: { 'Cache-Control': 'no-store' } },
        );
      }

      return NextResponse.json(
        {
          items: requestRows,
          totalItems: requestRows.length,
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const totalItems = requestRows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = requestRows.slice(start, end);

    const resolved = await Promise.all(
      pageRows.map((row) => loadTokenData(row.chainId, row.address)),
    );
    const items = resolved.filter((row): row is TokenResponseRow => row !== null);

    return NextResponse.json(
      {
        items,
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: safePage < totalPages,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to resolve token list',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BatchRequest;
    const rows: TokenRequestRow[] = [];
    const invalid: Array<{ chainId?: number; address?: string }> = [];

    if (Array.isArray(body?.requests) && body.requests.length) {
      for (const req of body.requests) {
        const chainId = Number(req?.chainId);
        const normalizedAddress =
          typeof req?.address === 'string'
            ? normalizeAndValidateAddress(req.address)
            : null;
        if (!Number.isFinite(chainId) || chainId <= 0 || !normalizedAddress) {
          invalid.push({ chainId: req?.chainId, address: req?.address });
          continue;
        }
        rows.push({ chainId, address: normalizedAddress });
      }
    } else if (Number.isFinite(Number(body?.chainId)) && Array.isArray(body?.addresses)) {
      const chainId = Number(body.chainId);
      for (const addr of body.addresses) {
        const normalizedAddress =
          typeof addr === 'string' ? normalizeAndValidateAddress(addr) : null;
        if (!normalizedAddress) {
          invalid.push({ chainId, address: addr });
          continue;
        }
        rows.push({ chainId, address: normalizedAddress });
      }
    } else {
      return NextResponse.json(
        {
          error:
            'POST /api/spCoin/tokens requires either { "chainId": number, "addresses": string[] } or { "requests": [{ "chainId": number, "address": string }] }',
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const uniqueRows = Array.from(
      new Map(rows.map((row) => [`${row.chainId}:${row.address}`, row])).values(),
    );

    const resolved = await Promise.all(
      uniqueRows.map((row) => loadTokenData(row.chainId, row.address)),
    );
    const items = resolved.filter((row): row is TokenResponseRow => row !== null);
    const foundKeys = new Set(items.map((item) => `${item.chainId}:${item.address}`));
    const missing = uniqueRows.filter(
      (row) => !foundKeys.has(`${row.chainId}:${row.address}`),
    );

    return NextResponse.json(
      {
        items,
        countRequested: uniqueRows.length,
        countFound: items.length,
        missing,
        invalid,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process token batch request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
