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
const SPCOIN_ACCESS_MODULES_ROOT = path.join(
  process.cwd(),
  'spCoinAccess',
  'packages',
  '@sponsorcoin',
  'spcoin-access-modules',
);

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatTimestamp(date: Date) {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toDisplayTitle(input: string) {
  const trimmed = String(input || '').trim();
  return trimmed || 'TypeScript File';
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

function buildScriptTemplateContent(filePath: string, name: string, scriptType: JavaScriptScriptType) {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const now = new Date();
  const title = toDisplayTitle(name);
  const purpose =
    scriptType === 'util'
      ? 'Offchain utility TypeScript file for reusable local helpers and setup.'
      : 'Standalone offchain TypeScript file that can orchestrate multiple onchain method calls.';
  return `// File: ${relativePath}
// Date:  ${formatTimestamp(now)}
// Author: R.M.
// Purpose: ${purpose}

type ScriptContext = {
  network: string;
  accounts: {
    deployer?: string;
    user?: string;
    recipient?: string;
  };
};

async function callOnChainMethod(
  methodName: string,
  params: Record<string, unknown>,
  context: ScriptContext,
) {
  console.log(\`[onchain] \${methodName}\`, {
    network: context.network,
    params,
  });

  // TODO: Replace this stub with the actual contract call or lab bridge.
  return {
    ok: true,
    methodName,
    params,
  };
}

export async function run${toCamelCaseFileStem(title).charAt(0).toUpperCase()}${toCamelCaseFileStem(title).slice(1)}(
  context: ScriptContext,
) {
  console.log(\`Running ${title}\`);

  const results = [];

  // TODO: Compose the offchain flow for this test by chaining one or more onchain methods.
  results.push(
    await callOnChainMethod(
      'replaceWithFirstOnChainMethod',
      {
        example: true,
      },
      context,
    ),
  );

  results.push(
    await callOnChainMethod(
      'replaceWithSecondOnChainMethod',
      {
        dependsOnPreviousStep: true,
      },
      context,
    ),
  );

  return {
    script: '${title}',
    ok: results.every((result) => Boolean(result?.ok)),
    results,
  };
}

export default run${toCamelCaseFileStem(title).charAt(0).toUpperCase()}${toCamelCaseFileStem(title).slice(1)};
`;
}

function resolveReadableTypeScriptFilePath(filePath: string) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!absolutePath.startsWith(SPONSOR_COIN_LAB_ROOT) && !absolutePath.startsWith(SPCOIN_ACCESS_MODULES_ROOT)) {
    throw new Error('Invalid file path.');
  }
  return absolutePath;
}

function resolveWritableTypeScriptFilePath(filePath: string) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!absolutePath.startsWith(SPONSOR_COIN_LAB_ROOT) && !absolutePath.startsWith(SPCOIN_ACCESS_MODULES_ROOT)) {
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
    const absolutePath = resolveReadableTypeScriptFilePath(filePath);
    const content = await fs.readFile(absolutePath, 'utf8');
    return NextResponse.json({ ok: true, filePath, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown TypeScript file read error.';
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
    await fs.writeFile(filePath, buildScriptTemplateContent(filePath, name, scriptType), 'utf8');

    const script: LabJavaScriptScript = {
      id: `javascript-script-${sanitizeIdSegment(name)}-${Date.now()}`,
      name,
      scriptType,
      filePath: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
    };

    return NextResponse.json({ ok: true, script });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown TypeScript file creation error.';
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

    const absolutePath = resolveWritableTypeScriptFilePath(filePath);

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
    const message = error instanceof Error ? error.message : 'Unknown TypeScript file deletion error.';
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
    const absolutePath = resolveWritableTypeScriptFilePath(filePath);
    await fs.writeFile(absolutePath, String(body?.content || ''), 'utf8');
    return NextResponse.json({ ok: true, filePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown TypeScript file save error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
