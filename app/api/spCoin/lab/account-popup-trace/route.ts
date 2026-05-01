import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TRACE_DIR = path.join(process.cwd(), 'logs');
const TRACE_FILE_NAME = 'sponsorCoinLab-account-popup-trace.log';
const TRACE_FILE_PATH = path.join(TRACE_DIR, TRACE_FILE_NAME);
const MAX_LINE_LENGTH = 4000;
const MAX_TAIL_BYTES = 256 * 1024;

function sanitizeTraceText(value: unknown) {
  return String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, MAX_LINE_LENGTH);
}

async function ensureTraceDir() {
  await fs.mkdir(TRACE_DIR, { recursive: true });
}

async function appendTraceRecord(record: Record<string, unknown>) {
  await ensureTraceDir();
  await fs.appendFile(TRACE_FILE_PATH, `${JSON.stringify(record)}\n`, 'utf8');
}

async function readTraceTail() {
  try {
    const stat = await fs.stat(TRACE_FILE_PATH);
    const start = Math.max(0, stat.size - MAX_TAIL_BYTES);
    const handle = await fs.open(TRACE_FILE_PATH, 'r');
    try {
      const buffer = Buffer.alloc(stat.size - start);
      await handle.read(buffer, 0, buffer.length, start);
      return buffer.toString('utf8');
    } finally {
      await handle.close();
    }
  } catch {
    return '';
  }
}

export async function GET() {
  const tail = await readTraceTail();
  return NextResponse.json(
    {
      ok: true,
      path: TRACE_FILE_PATH,
      tail,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      line?: unknown;
      lines?: unknown;
      source?: unknown;
      href?: unknown;
    };
    const rawLines = Array.isArray(body.lines) ? body.lines : [body.line];
    const lines = rawLines.map(sanitizeTraceText).filter(Boolean);
    if (lines.length === 0) {
      return NextResponse.json({ ok: false, message: 'Trace line is required.' }, { status: 400 });
    }

    const source = sanitizeTraceText(body.source) || 'browser';
    const href = sanitizeTraceText(body.href);
    const recordedAt = new Date().toISOString();
    for (const line of lines) {
      await appendTraceRecord({
        recordedAt,
        source,
        href,
        line,
      });
    }
    return NextResponse.json(
      {
        ok: true,
        path: TRACE_FILE_PATH,
        lines: lines.length,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown trace write error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
