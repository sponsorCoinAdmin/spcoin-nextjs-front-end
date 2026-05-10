import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

type LabScriptParam = {
  key: string;
  value: string;
};

type LabScriptStep = {
  step: number;
  name: string;
  panel: string;
  method: string;
  params: LabScriptParam[];
  breakpoint?: boolean;
  hasMissingRequiredParams?: boolean;
  network?: string;
  mode?: 'metamask' | 'hardhat';
  'msg.sender'?: string;
};

type LabScript = {
  id: string;
  name: string;
  'Date Created': string;
  network: string;
  steps: LabScriptStep[];
  isSystemScript?: boolean;
  isLazy?: boolean;
  storageFileName?: string;
};

type ScriptPayload = {
  scripts?: LabScript[];
  selectedScriptId?: string;
};

const SCRIPTS_ROOT = path.join(process.cwd(), 'spCoinAccess', 'scripts');
const SYSTEM_SCRIPTS_ROOT = path.join(process.cwd(), 'spCoinAccess', 'systemTests');
const MANIFEST_PATH = path.join(SCRIPTS_ROOT, 'manifest.json');

function sanitizeFileSegment(value: string) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'script';
}

function buildScriptFileName(script: LabScript) {
  return `${sanitizeFileSegment(script.name)}--${sanitizeFileSegment(script.id)}.json`;
}

function humanizeScriptSlug(value: string) {
  return String(value || '')
    .split('-')
    .filter(Boolean)
    .map((part) => (part ? `${part.slice(0, 1).toUpperCase()}${part.slice(1)}` : part))
    .join(' ');
}

function buildLazyScriptSummary(fileName: string, isSystemScript = false): LabScript | null {
  const baseName = fileName.replace(/\.json$/i, '');
  const separatorIndex = baseName.lastIndexOf('--');
  if (separatorIndex < 0) return null;
  const nameSlug = baseName.slice(0, separatorIndex);
  const idSlug = baseName.slice(separatorIndex + 2);
  if (!idSlug) return null;
  return {
    id: idSlug,
    name: humanizeScriptSlug(nameSlug) || idSlug,
    'Date Created': '',
    network: '',
    steps: [],
    isSystemScript: isSystemScript || undefined,
    isLazy: true,
    storageFileName: fileName,
  };
}

function sortScripts(a: LabScript, b: LabScript) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

function stripRuntimeScriptMetadata(script: LabScript): LabScript {
  return {
    id: script.id,
    name: script.name,
    'Date Created': script['Date Created'],
    network: script.network,
    steps: script.steps,
    isSystemScript: script.isSystemScript || undefined,
  };
}

async function ensureScriptsRoot() {
  await fs.mkdir(SCRIPTS_ROOT, { recursive: true });
}

async function ensureSystemScriptsRoot() {
  await fs.mkdir(SYSTEM_SCRIPTS_ROOT, { recursive: true });
}

async function readManifest() {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf8');
    const parsed = JSON.parse(raw) as { selectedScriptId?: string };
    return typeof parsed?.selectedScriptId === 'string' ? parsed.selectedScriptId : '';
  } catch {
    return '';
  }
}

async function writeManifest(selectedScriptId: string) {
  await fs.writeFile(MANIFEST_PATH, JSON.stringify({ selectedScriptId }, null, 2), 'utf8');
}

async function readScriptsFromDisk(): Promise<LabScript[]> {
  await ensureScriptsRoot();
  const entries = await fs.readdir(SCRIPTS_ROOT, { withFileTypes: true });
  const fileNames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'manifest.json')
    .map((entry) => entry.name);

  const scripts = await Promise.all(
    fileNames.map(async (fileName) => {
      const raw = await fs.readFile(path.join(SCRIPTS_ROOT, fileName), 'utf8');
      return JSON.parse(raw) as LabScript;
    }),
  );

  return scripts.filter((script) => script && typeof script.id === 'string' && typeof script.name === 'string').sort(sortScripts);
}

async function readScriptSummariesFromDisk(): Promise<LabScript[]> {
  await ensureScriptsRoot();
  const entries = await fs.readdir(SCRIPTS_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'manifest.json')
    .map((entry) => buildLazyScriptSummary(entry.name))
    .filter((script): script is LabScript => Boolean(script))
    .sort(sortScripts);
}

async function readSystemScriptsFromDisk(): Promise<LabScript[]> {
  await ensureSystemScriptsRoot();
  const entries = await fs.readdir(SYSTEM_SCRIPTS_ROOT, { withFileTypes: true });
  const fileNames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name);

  const scripts = await Promise.all(
    fileNames.map(async (fileName) => {
      const raw = await fs.readFile(path.join(SYSTEM_SCRIPTS_ROOT, fileName), 'utf8');
      return JSON.parse(raw) as LabScript;
    }),
  );

  return scripts
    .filter((script) => script && typeof script.id === 'string' && typeof script.name === 'string')
    .map((script) => ({ ...script, isSystemScript: true }))
    .sort(sortScripts);
}

async function readSystemScriptSummariesFromDisk(): Promise<LabScript[]> {
  await ensureSystemScriptsRoot();
  const entries = await fs.readdir(SYSTEM_SCRIPTS_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => buildLazyScriptSummary(entry.name, true))
    .filter((script): script is LabScript => Boolean(script))
    .sort(sortScripts);
}

async function readScriptById(scriptId: string): Promise<LabScript | null> {
  const sanitizedId = sanitizeFileSegment(scriptId);
  if (!sanitizedId) return null;
  const candidates: Array<{ root: string; ensure: () => Promise<void>; isSystemScript: boolean }> = [
    { root: SCRIPTS_ROOT, ensure: ensureScriptsRoot, isSystemScript: false },
    { root: SYSTEM_SCRIPTS_ROOT, ensure: ensureSystemScriptsRoot, isSystemScript: true },
  ];

  for (const candidate of candidates) {
    await candidate.ensure();
    const entries = await fs.readdir(candidate.root, { withFileTypes: true });
    const match = entries.find(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.json') &&
        entry.name !== 'manifest.json' &&
        entry.name.replace(/\.json$/i, '').endsWith(`--${sanitizedId}`),
    );
    if (!match) continue;
    const raw = await fs.readFile(path.join(candidate.root, match.name), 'utf8');
    const parsed = JSON.parse(raw) as LabScript;
    if (!parsed || typeof parsed.id !== 'string' || typeof parsed.name !== 'string') return null;
    return {
      ...parsed,
      isSystemScript: candidate.isSystemScript || parsed.isSystemScript || undefined,
      isLazy: false,
      storageFileName: match.name,
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scriptId = String(searchParams.get('scriptId') || '').trim();
    if (scriptId) {
      const script = await readScriptById(scriptId);
      if (!script) return NextResponse.json({ ok: false, message: 'Script not found.' }, { status: 404 });
      return NextResponse.json({ script }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const lazy = searchParams.get('lazy') === 'true';
    const [scripts, systemScripts, selectedScriptId] = lazy
      ? await Promise.all([readScriptSummariesFromDisk(), readSystemScriptSummariesFromDisk(), readManifest()])
      : await Promise.all([readScriptsFromDisk(), readSystemScriptsFromDisk(), readManifest()]);
    const visibleSelectedScriptId = scripts.some((script) => script.id === selectedScriptId) ? selectedScriptId : '';
    return NextResponse.json(
      { scripts, systemScripts, selectedScriptId: visibleSelectedScriptId },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown script read error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ScriptPayload;
    const scripts = Array.isArray(body?.scripts) ? body.scripts.filter((script) => !script?.isSystemScript) : [];
    const selectedScriptId = typeof body?.selectedScriptId === 'string' ? body.selectedScriptId : '';

    await ensureScriptsRoot();

    const existingEntries = await fs.readdir(SCRIPTS_ROOT, { withFileTypes: true });
    const existingFiles = new Set(
      existingEntries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'manifest.json')
        .map((entry) => entry.name),
    );

    const nextFiles = new Set<string>();
    await Promise.all(
      scripts.map(async (script) => {
        const fileName = typeof script.storageFileName === 'string' && script.storageFileName.trim()
          ? script.storageFileName
          : buildScriptFileName(script);
        nextFiles.add(fileName);
        if (script.isLazy) return;
        await fs.writeFile(path.join(SCRIPTS_ROOT, fileName), JSON.stringify(stripRuntimeScriptMetadata(script), null, 2), 'utf8');
      }),
    );

    await Promise.all(
      Array.from(existingFiles)
        .filter((fileName) => !nextFiles.has(fileName))
        .map((fileName) => fs.unlink(path.join(SCRIPTS_ROOT, fileName))),
    );

    await writeManifest(selectedScriptId);

    return NextResponse.json({ ok: true, scriptsSaved: scripts.length, selectedScriptId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown script save error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
