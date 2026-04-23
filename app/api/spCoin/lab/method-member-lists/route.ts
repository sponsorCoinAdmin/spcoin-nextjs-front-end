import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_METHOD_MEMBER_LIST_PAYLOAD,
  normalizeMethodMemberListPayload,
  type MethodMemberListPayload,
} from '@/lib/spCoinLab/methodMemberLists';

export const dynamic = 'force-dynamic';

const METHOD_MEMBER_LISTS_DIR = path.join(process.cwd(), 'resources', 'data', 'spCoinLab');
const METHOD_MEMBER_LISTS_PATH = path.join(METHOD_MEMBER_LISTS_DIR, 'methodMemberLists.json');

async function ensureMethodMemberListsDir() {
  await fs.mkdir(METHOD_MEMBER_LISTS_DIR, { recursive: true });
}

function buildPersistedPayload(input: unknown): MethodMemberListPayload {
  return {
    ...normalizeMethodMemberListPayload(input),
    updatedAt: new Date().toISOString(),
  };
}

async function writePayload(payload: MethodMemberListPayload) {
  await ensureMethodMemberListsDir();
  await fs.writeFile(METHOD_MEMBER_LISTS_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function readPayload(): Promise<{ payload: MethodMemberListPayload; wroteFile: boolean }> {
  try {
    const raw = await fs.readFile(METHOD_MEMBER_LISTS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const normalized = buildPersistedPayload(parsed);
    const normalizedText = `${JSON.stringify(normalized, null, 2)}\n`;
    if (raw !== normalizedText) {
      await writePayload(normalized);
      return { payload: normalized, wroteFile: true };
    }
    return { payload: normalized, wroteFile: false };
  } catch {
    const seeded = buildPersistedPayload(DEFAULT_METHOD_MEMBER_LIST_PAYLOAD);
    await writePayload(seeded);
    return { payload: seeded, wroteFile: true };
  }
}

export async function GET() {
  try {
    const { payload } = await readPayload();
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown method member list read error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const payload = buildPersistedPayload(body);
    await writePayload(payload);
    return NextResponse.json({ ok: true, payload }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown method member list save error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
