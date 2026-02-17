// File: app/api/spcoin/accounts/route.ts
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACCOUNTS_DIR = path.join(process.cwd(), 'public', 'assets', 'accounts');
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

type AccountRow = {
  address: string;
  data: unknown;
};

type AccountDirectoryRow = {
  address: string;
  folderName: string;
};

type BatchQueryBody = {
  addresses?: string[];
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

function normalizeAddressFolderName(folderName: string): string | null {
  const trimmed = folderName.trim();
  if (!/^0[xX][0-9a-fA-F]{40}$/.test(trimmed)) return null;
  return `0x${trimmed.slice(2).toLowerCase()}`;
}

async function getAccountDirectories(): Promise<AccountDirectoryRow[]> {
  const entries = await fs.readdir(ACCOUNTS_DIR, { withFileTypes: true });
  const rows = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const address = normalizeAddressFolderName(entry.name);
      if (!address) return null;
      return { address, folderName: entry.name };
    })
    .filter((row): row is AccountDirectoryRow => row !== null)
    .sort((a, b) => a.address.localeCompare(b.address));
  return rows;
}

async function loadAccountData(row: AccountDirectoryRow): Promise<AccountRow | null> {
  const filePath = path.join(ACCOUNTS_DIR, row.folderName, 'account.json');

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const normalized = raw.replace(/^\uFEFF/, '');
    return { address: row.address, data: JSON.parse(normalized) };
  } catch {
    return null;
  }
}

async function loadAccountDataByAddress(rawAddress: string): Promise<AccountRow | null> {
  if (!isAddress(rawAddress)) return null;
  const address = normalizeAddress(rawAddress);
  const folderName = toFolderName(address);
  const filePath = path.join(ACCOUNTS_DIR, folderName, 'account.json');
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const normalized = raw.replace(/^\uFEFF/, '');
    return { address, data: JSON.parse(normalized) };
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

  try {
    const directoryRows = await getAccountDirectories();
    const addresses = directoryRows.map((row) => row.address);

    if (!allData) {
      return NextResponse.json(addresses, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const totalItems = addresses.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = directoryRows.slice(start, end);
    const rows = await Promise.all(pageRows.map(loadAccountData));
    const items = rows.filter((row): row is AccountRow => row !== null);

    return NextResponse.json(
      {
        items,
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: safePage < totalPages,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to read accounts directory',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BatchQueryBody;
    const addresses = Array.isArray(body?.addresses) ? body.addresses : [];

    if (!addresses.length) {
      return NextResponse.json(
        { error: 'POST /api/spCoin/accounts requires body: { "addresses": string[] }' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const unique = Array.from(
      new Set(
        addresses
          .map((a) => (typeof a === 'string' ? a.trim() : ''))
          .filter(Boolean),
      ),
    );

    const valid = unique.filter(isAddress);
    const invalid = unique.filter((a) => !isAddress(a));

    const rows = await Promise.all(valid.map(loadAccountDataByAddress));
    const items = rows.filter((row): row is AccountRow => row !== null);
    const found = new Set(items.map((x) => x.address));
    const missing = valid.map(normalizeAddress).filter((a) => !found.has(a));

    return NextResponse.json(
      {
        items,
        countRequested: unique.length,
        countValid: valid.length,
        countFound: items.length,
        missing,
        invalid,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process batch request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
