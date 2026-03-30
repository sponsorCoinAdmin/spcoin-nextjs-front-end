import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { promisify } from 'util';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = path.join(process.cwd(), 'tools', 'compareSpCoinContractSize.js');
const CACHE_DIR = path.join(process.cwd(), 'tools', '.cache', 'spcoin-size-comparisons');

function getCacheFilePath(previousReleaseDir: string, latestReleaseDir: string) {
  const cacheKey = crypto
    .createHash('sha1')
    .update(`${previousReleaseDir}\n${latestReleaseDir}`)
    .digest('hex');
  return path.join(CACHE_DIR, `${cacheKey}.json`);
}

async function readCachedComparison(previousReleaseDir: string, latestReleaseDir: string) {
  try {
    const cachePath = getCacheFilePath(previousReleaseDir, latestReleaseDir);
    const content = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function writeCachedComparison(previousReleaseDir: string, latestReleaseDir: string, payload: Record<string, unknown>) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const cachePath = getCacheFilePath(previousReleaseDir, latestReleaseDir);
  await fs.writeFile(cachePath, JSON.stringify(payload, null, 2), 'utf8');
}

async function runComparison(previousReleaseDir: string, latestReleaseDir: string) {
  const cached = await readCachedComparison(previousReleaseDir, latestReleaseDir);
  if (cached) {
    return NextResponse.json({
      ...cached,
      cached: true,
    });
  }

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [SCRIPT_PATH, previousReleaseDir, latestReleaseDir], {
      cwd: process.cwd(),
      maxBuffer: 50 * 1024 * 1024,
      timeout: 10 * 60 * 1000,
    });
    const report = JSON.parse(String(stdout || '{}'));

    const payload = {
      ok: true,
      scriptPath: SCRIPT_PATH,
      previousReleaseDir,
      latestReleaseDir,
      report,
      stderr: String(stderr || '').trim(),
      cached: false,
    };
    await writeCachedComparison(previousReleaseDir, latestReleaseDir, payload);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to compare SPCoin contract sizes.';
    return NextResponse.json({
      ok: false,
      scriptPath: SCRIPT_PATH,
      previousReleaseDir,
      latestReleaseDir,
      message,
    }, { status: 500 });
  }
}

export async function GET() {
  const defaultPreviousReleaseDir = path.join(process.cwd(), 'spCoinAccess', 'contracts', 'spCoinOrig.BAK');
  const defaultLatestReleaseDir = path.join(process.cwd(), 'spCoinAccess', 'contracts', 'spCoin');
  return runComparison(defaultPreviousReleaseDir, defaultLatestReleaseDir);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    previousReleaseDir?: string;
    latestReleaseDir?: string;
  };
  const previousReleaseDir = String(payload?.previousReleaseDir || '').trim();
  const latestReleaseDir = String(payload?.latestReleaseDir || '').trim();

  if (!previousReleaseDir || !latestReleaseDir) {
    return NextResponse.json(
      {
        ok: false,
        scriptPath: SCRIPT_PATH,
        message: 'previousReleaseDir and latestReleaseDir are required.',
      },
      { status: 400 },
    );
  }

  return runComparison(previousReleaseDir, latestReleaseDir);
}
