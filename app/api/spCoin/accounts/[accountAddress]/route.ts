// File: app/api/spCoin/accounts/[accountAddress]/route.ts
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { readBearerToken, validateSessionToken } from '@/lib/server/spCoinAuth';
import { getWalletLogoURL } from '@/lib/context/helpers/assetHelpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACCOUNTS_DIR = path.join(process.cwd(), 'public', 'assets', 'accounts');
const DEFAULT_ACCOUNT_LOGO_URL = '/assets/miscellaneous/Anonymous.png';
const MAX_LOGO_BYTES = 500 * 1024;
type RouteContext = { params: Promise<{ accountAddress: string }> };

type Target = 'account' | 'logo';

class PayloadTooLargeError extends Error {
  readonly status = 413;
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

function parseTarget(url: URL): Target {
  const target = (url.searchParams.get('target') ?? 'account').toLowerCase();
  return target === 'logo' ? 'logo' : 'account';
}

async function readLogoBuffer(request: Request): Promise<Buffer> {
  const contentLengthHeader = request.headers.get('content-length');
  const contentLength = Number(contentLengthHeader ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_LOGO_BYTES) {
    throw new PayloadTooLargeError(
      `Logo exceeds ${Math.round(MAX_LOGO_BYTES / 1024)} KiB limit.`,
    );
  }

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.toLowerCase().includes('multipart/form-data')) {
    const form = await request.formData();
    const file = (form.get('file') ?? form.get('logo')) as File | null;
    if (!file) {
      throw new Error('Missing file part. Use form-data field "file" or "logo".');
    }
    if (file.size > MAX_LOGO_BYTES) {
      throw new PayloadTooLargeError(
        `Logo exceeds ${Math.round(MAX_LOGO_BYTES / 1024)} KiB limit.`,
      );
    }
    const bytes = await file.arrayBuffer();
    const logo = Buffer.from(bytes);
    if (logo.length > MAX_LOGO_BYTES) {
      throw new PayloadTooLargeError(
        `Logo exceeds ${Math.round(MAX_LOGO_BYTES / 1024)} KiB limit.`,
      );
    }
    return logo;
  }

  const bytes = await request.arrayBuffer();
  const buffer = Buffer.from(bytes);
  if (!buffer.length) {
    throw new Error('Empty request body for logo target.');
  }
  if (buffer.length > MAX_LOGO_BYTES) {
    throw new PayloadTooLargeError(
      `Logo exceeds ${Math.round(MAX_LOGO_BYTES / 1024)} KiB limit.`,
    );
  }
  return buffer;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const { accountAddress } = await context.params;
  const rawAddress = accountAddress ?? '';
  if (!isAddress(rawAddress)) {
    return NextResponse.json(
      { error: 'Invalid accountAddress. Expected 0x + 40 hex chars.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const address = normalizeAddress(rawAddress);
  const folder = toFolderName(address);
  const filePath = path.join(ACCOUNTS_DIR, folder, 'account.json');
  const logoFilePath = path.join(ACCOUNTS_DIR, folder, 'logo.png');

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw.replace(/^\uFEFF/, '')) as Record<string, unknown>;
    let hasConstructedLogo = false;
    try {
      await fs.access(logoFilePath);
      hasConstructedLogo = true;
    } catch {
      hasConstructedLogo = false;
    }
    const resolvedLogoURL = hasConstructedLogo
      ? getWalletLogoURL(address)
      : DEFAULT_ACCOUNT_LOGO_URL;
    const responseData = {
      ...data,
      logoURL: resolvedLogoURL,
    };

    return NextResponse.json(
      {
        address,
        data: responseData,
        logoURL: resolvedLogoURL,
        hasLogo: hasConstructedLogo,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      {
        error: 'Account not found',
        address,
        file: `/assets/accounts/${folder}/account.json`,
      },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  const { accountAddress } = await context.params;
  const rawAddress = accountAddress ?? '';
  if (!isAddress(rawAddress)) {
    return NextResponse.json(
      { error: 'Invalid accountAddress. Expected 0x + 40 hex chars.' },
      { status: 400 },
    );
  }

  const token = readBearerToken(request.headers.get('authorization'));
  const auth = validateSessionToken(token, rawAddress);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const address = normalizeAddress(rawAddress);
  const folder = toFolderName(address);
  const dirPath = path.join(ACCOUNTS_DIR, folder);
  const url = new URL(request.url);
  const target = parseTarget(url);

  try {
    await fs.mkdir(dirPath, { recursive: true });

    if (target === 'account') {
      const body = await request.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json(
          { error: 'account target requires a JSON object body.' },
          { status: 400 },
        );
      }

      const filePath = path.join(dirPath, 'account.json');
      const payload = `${JSON.stringify(body, null, 2)}\n`;
      await fs.writeFile(filePath, payload, 'utf8');

      return NextResponse.json(
        {
          ok: true,
          address,
          target: 'account',
          file: `/assets/accounts/${folder}/account.json`,
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const logo = await readLogoBuffer(request);
    const logoPath = path.join(dirPath, 'logo.png');
    await fs.writeFile(logoPath, logo);

    return NextResponse.json(
      {
        ok: true,
        address,
        target: 'logo',
        bytes: logo.length,
        file: `/assets/accounts/${folder}/logo.png`,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json(
        {
          error: error.message,
          maxBytes: MAX_LOGO_BYTES,
        },
        { status: error.status, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.json(
      {
        error: 'Failed to write account asset',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export const POST = PUT;
