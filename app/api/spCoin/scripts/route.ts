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
};

type ScriptPayload = {
  scripts?: LabScript[];
  selectedScriptId?: string;
};

const SCRIPTS_ROOT = path.join(process.cwd(), 'spCoinAccess', 'scripts');
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

function sortScripts(a: LabScript, b: LabScript) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

async function ensureScriptsRoot() {
  await fs.mkdir(SCRIPTS_ROOT, { recursive: true });
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

export async function GET() {
  try {
    const [scripts, selectedScriptId] = await Promise.all([readScriptsFromDisk(), readManifest()]);
    return NextResponse.json({ scripts, selectedScriptId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown script read error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ScriptPayload;
    const scripts = Array.isArray(body?.scripts) ? body.scripts : [];
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
        const fileName = buildScriptFileName(script);
        nextFiles.add(fileName);
        await fs.writeFile(path.join(SCRIPTS_ROOT, fileName), JSON.stringify(script, null, 2), 'utf8');
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
