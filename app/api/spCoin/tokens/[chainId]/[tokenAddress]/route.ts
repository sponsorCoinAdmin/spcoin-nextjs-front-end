// File: app/api/spCoin/tokens/[chainId]/[tokenAddress]/route.ts
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKENS_DIR = path.join(process.cwd(), 'public', 'assets', 'blockchains');
const MAX_LOGO_BYTES = 500 * 1024;

type RouteContext = { params: Promise<{ chainId: string; tokenAddress: string }> };
type Target = 'info' | 'logo';

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
  const target = (url.searchParams.get('target') ?? 'info').toLowerCase();
  return target === 'logo' ? 'logo' : 'info';
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
  const { chainId: chainIdRaw, tokenAddress: tokenAddressRaw } = await context.params;
  const chainId = Number(chainIdRaw);

  if (!Number.isFinite(chainId) || chainId <= 0) {
    return NextResponse.json(
      { error: 'Invalid chainId. Expected positive integer.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (!isAddress(tokenAddressRaw)) {
    return NextResponse.json(
      { error: 'Invalid tokenAddress. Expected 0x + 40 hex chars.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const address = normalizeAddress(tokenAddressRaw);
  const folder = toFolderName(address);
  const infoPath = path.join(
    TOKENS_DIR,
    String(chainId),
    'contracts',
    folder,
    'info.json',
  );

  try {
    const raw = await fs.readFile(infoPath, 'utf8');
    const data = JSON.parse(raw);
    return NextResponse.json(
      { chainId, address, data },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      {
        error: 'Token not found',
        chainId,
        address,
        file: `/assets/blockchains/${chainId}/contracts/${folder}/info.json`,
      },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  const { chainId: chainIdRaw, tokenAddress: tokenAddressRaw } = await context.params;
  const chainId = Number(chainIdRaw);
  if (!Number.isFinite(chainId) || chainId <= 0) {
    return NextResponse.json(
      { error: 'Invalid chainId. Expected positive integer.' },
      { status: 400 },
    );
  }
  if (!isAddress(tokenAddressRaw)) {
    return NextResponse.json(
      { error: 'Invalid tokenAddress. Expected 0x + 40 hex chars.' },
      { status: 400 },
    );
  }

  const address = normalizeAddress(tokenAddressRaw);
  const folder = toFolderName(address);
  const dirPath = path.join(
    TOKENS_DIR,
    String(chainId),
    'contracts',
    folder,
  );
  const url = new URL(request.url);
  const target = parseTarget(url);

  try {
    await fs.mkdir(dirPath, { recursive: true });

    if (target === 'info') {
      const body = await request.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json(
          { error: 'info target requires a JSON object body.' },
          { status: 400 },
        );
      }

      const filePath = path.join(dirPath, 'info.json');
      const payload = `${JSON.stringify(body, null, 2)}\n`;
      await fs.writeFile(filePath, payload, 'utf8');

      return NextResponse.json(
        {
          ok: true,
          chainId,
          address,
          target: 'info',
          file: `/assets/blockchains/${chainId}/contracts/${folder}/info.json`,
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
        chainId,
        address,
        target: 'logo',
        bytes: logo.length,
        file: `/assets/blockchains/${chainId}/contracts/${folder}/logo.png`,
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
        error: 'Failed to write token asset',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export const POST = PUT;
