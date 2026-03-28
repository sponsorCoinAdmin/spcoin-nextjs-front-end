import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

type JavaScriptScriptType = 'test' | 'util';

type LabJavaScriptScript = {
  id: string;
  name: string;
  scriptType?: JavaScriptScriptType;
  filePath?: string;
  isSystemScript?: boolean;
};

const SPONSOR_COIN_LAB_ROOT = path.join(process.cwd(), 'app', '(menu)', '(dynamic)', 'SponsorCoinLab');
const JAVASCRIPT_MAIN_ROOT = path.join(SPONSOR_COIN_LAB_ROOT, 'JavaScripts', 'Main');

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatTimestamp(date: Date) {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toCamelCaseFileStem(input: string) {
  const parts = String(input || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'javaScriptScript';
  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      return index === 0 ? lower : `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join('');
}

function sanitizeIdSegment(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'javascript-script';
}

async function ensureJavaScriptRoot() {
  const root = JAVASCRIPT_MAIN_ROOT;
  await fs.mkdir(root, { recursive: true });
  return root;
}

async function ensureUniqueFilePath(root: string, baseName: string) {
  let counter = 1;
  let nextPath = path.join(root, `${baseName}.ts`);
  while (true) {
    try {
      await fs.access(nextPath);
      counter += 1;
      nextPath = path.join(root, `${baseName}${counter}.ts`);
    } catch {
      return nextPath;
    }
  }
}

function buildHeaderContent(filePath: string) {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const now = new Date();
  return `// File: ${relativePath}\n// Date:  ${formatTimestamp(now)}\n// Author: R.M.\n\nexport {};\n`;
}

function resolveJavaScriptFilePath(filePath: string) {
  const absolutePath = path.join(process.cwd(), filePath);
  if (!absolutePath.startsWith(SPONSOR_COIN_LAB_ROOT)) {
    throw new Error('Invalid file path.');
  }
  return absolutePath;
}

export async function GET(request: NextRequest) {
  try {
    const filePath = String(request.nextUrl.searchParams.get('filePath') || '').trim();
    if (!filePath) {
      return NextResponse.json({ ok: false, message: 'filePath is required.' }, { status: 400 });
    }
    const absolutePath = resolveJavaScriptFilePath(filePath);
    const content = await fs.readFile(absolutePath, 'utf8');
    return NextResponse.json({ ok: true, filePath, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JavaScript script read error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { name?: string; scriptType?: JavaScriptScriptType };
    const name = String(body?.name || '').trim();
    const scriptType: JavaScriptScriptType = body?.scriptType === 'util' ? 'util' : 'test';

    if (!name) {
      return NextResponse.json({ ok: false, message: 'Script name is required.' }, { status: 400 });
    }

    const root = await ensureJavaScriptRoot();
    const baseName = toCamelCaseFileStem(name);
    const filePath = await ensureUniqueFilePath(root, baseName);
    await fs.writeFile(filePath, buildHeaderContent(filePath), 'utf8');

    const script: LabJavaScriptScript = {
      id: `javascript-script-${sanitizeIdSegment(name)}-${Date.now()}`,
      name,
      scriptType,
      filePath: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
    };

    return NextResponse.json({ ok: true, script });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JavaScript script creation error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { filePath?: string };
    const filePath = String(body?.filePath || '').trim();
    if (!filePath) {
      return NextResponse.json({ ok: false, message: 'filePath is required.' }, { status: 400 });
    }

    const absolutePath = resolveJavaScriptFilePath(filePath);

    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code || '')
          : '';
      if (code !== 'ENOENT') {
        throw error;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JavaScript script deletion error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { filePath?: string; content?: string };
    const filePath = String(body?.filePath || '').trim();
    if (!filePath) {
      return NextResponse.json({ ok: false, message: 'filePath is required.' }, { status: 400 });
    }
    const absolutePath = resolveJavaScriptFilePath(filePath);
    await fs.writeFile(absolutePath, String(body?.content || ''), 'utf8');
    return NextResponse.json({ ok: true, filePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JavaScript script save error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
