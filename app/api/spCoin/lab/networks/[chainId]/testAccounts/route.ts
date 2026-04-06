import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import {
  normalizeAccountAddress,
  toAccountDiskFolderName,
} from '@/lib/accounts/accountAddress';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ chainId: string }> };

type TestAccountEntry =
  | string
  | {
      address?: unknown;
      privateKey?: unknown;
    };

function isAddress(value: string): boolean {
  return /^0[xX][0-9a-fA-F]{40}$/.test(value);
}

function normalizeAddress(value: string): string {
  return normalizeAccountAddress(value) ?? '';
}

function getEntryAddress(entry: TestAccountEntry): string {
  if (typeof entry === 'string') return entry;
  return typeof entry?.address === 'string' ? entry.address : '';
}

function makePaths(chainId: string) {
  const root = process.cwd();
  return {
    testAccountsPath: path.join(root, 'public', 'assets', 'spCoinLab', 'networks', chainId, 'testAccounts.json'),
    accountsDir: path.join(root, 'public', 'assets', 'accounts'),
  };
}

async function readTestAccounts(testAccountsPath: string): Promise<TestAccountEntry[]> {
  const raw = await fs.readFile(testAccountsPath, 'utf8');
  const parsed = JSON.parse(raw.replace(/^\uFEFF/, '')) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('testAccounts.json must contain an array.');
  }
  return parsed as TestAccountEntry[];
}

async function writeTestAccounts(testAccountsPath: string, entries: TestAccountEntry[]) {
  await fs.mkdir(path.dirname(testAccountsPath), { recursive: true });
  await fs.writeFile(testAccountsPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

async function hasLocalAccount(accountsDir: string, rawAddress: string) {
  const folder = toAccountDiskFolderName(rawAddress);
  const filePath = path.join(accountsDir, folder, 'account.json');
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { chainId } = await context.params;

  try {
    const body = (await request.json()) as { address?: unknown; privateKey?: unknown };
    const rawAddress = String(body?.address || '').trim();
    const privateKey = String(body?.privateKey || '').trim();

    if (!isAddress(rawAddress)) {
      return NextResponse.json(
        { error: 'Invalid account address. Expected 0x + 40 hex chars.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const { testAccountsPath, accountsDir } = makePaths(chainId);
    const accountExists = await hasLocalAccount(accountsDir, rawAddress);
    if (!accountExists) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const entries = await readTestAccounts(testAccountsPath);
    const normalizedTarget = normalizeAddress(rawAddress);
    const duplicate = entries.some((entry) => {
      const address = getEntryAddress(entry);
      return isAddress(address) && normalizeAddress(address) === normalizedTarget;
    });
    if (duplicate) {
      return NextResponse.json(
        { error: 'Duplicate Account' },
        { status: 409, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const nextEntry: TestAccountEntry = privateKey
      ? { address: toAccountDiskFolderName(rawAddress), privateKey }
      : toAccountDiskFolderName(rawAddress);
    const nextEntries = [...entries, nextEntry];
    await writeTestAccounts(testAccountsPath, nextEntries);

    return NextResponse.json(
      {
        ok: true,
        status: 'Account added.',
        address: toAccountDiskFolderName(rawAddress),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to add test account',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { chainId } = await context.params;

  try {
    const body = (await request.json()) as { address?: unknown };
    const rawAddress = String(body?.address || '').trim();

    if (!isAddress(rawAddress)) {
      return NextResponse.json(
        { error: 'Invalid account address. Expected 0x + 40 hex chars.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const { testAccountsPath } = makePaths(chainId);
    const entries = await readTestAccounts(testAccountsPath);
    const normalizedTarget = normalizeAddress(rawAddress);
    const nextEntries = entries.filter((entry) => {
      const address = getEntryAddress(entry);
      return !isAddress(address) || normalizeAddress(address) !== normalizedTarget;
    });

    if (nextEntries.length === entries.length) {
      return NextResponse.json(
        { error: 'Account not found in testAccounts.json' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    await writeTestAccounts(testAccountsPath, nextEntries);

    return NextResponse.json(
      {
        ok: true,
        status: 'Account deleted.',
        address: toAccountDiskFolderName(rawAddress),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to delete test account',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
