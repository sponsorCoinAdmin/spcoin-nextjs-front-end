import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

import { compareSpCoinContractSizes, getSpCoinSourceFingerprint } from '@/lib/spCoin/contractCompiler';

export const runtime = 'nodejs';

const CACHE_DIR = path.join(process.cwd(), 'tools', '.cache', 'spcoin-size-comparisons');

function getCacheFilePath(previousReleaseDir: string, latestReleaseDir: string, fingerprints: { previous: string; latest: string }) {
  const cacheKey = crypto
    .createHash('sha1')
    .update(`${previousReleaseDir}\n${latestReleaseDir}\n${fingerprints.previous}\n${fingerprints.latest}`)
    .digest('hex');
  return path.join(CACHE_DIR, `${cacheKey}.json`);
}

async function readCachedComparison(
  previousReleaseDir: string,
  latestReleaseDir: string,
  fingerprints: { previous: string; latest: string },
) {
  try {
    const cachePath = getCacheFilePath(previousReleaseDir, latestReleaseDir, fingerprints);
    const content = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function writeCachedComparison(
  previousReleaseDir: string,
  latestReleaseDir: string,
  fingerprints: { previous: string; latest: string },
  payload: Record<string, unknown>,
) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const cachePath = getCacheFilePath(previousReleaseDir, latestReleaseDir, fingerprints);
  await fs.writeFile(cachePath, JSON.stringify(payload, null, 2), 'utf8');
}

async function runComparison(previousReleaseDir: string, latestReleaseDir: string) {
  try {
    const [previousSource, latestSource] = await Promise.all([
      getSpCoinSourceFingerprint({ sourceRoot: previousReleaseDir }),
      getSpCoinSourceFingerprint({ sourceRoot: latestReleaseDir }),
    ]);
    const fingerprints = {
      previous: previousSource.sourceFingerprint,
      latest: latestSource.sourceFingerprint,
    };
    const cached = await readCachedComparison(
      path.resolve(previousReleaseDir),
      path.resolve(latestReleaseDir),
      fingerprints,
    );
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    const comparison = await compareSpCoinContractSizes({
      previousReleaseDir,
      latestReleaseDir,
    });

    const payload = {
      ok: true,
      scriptPath: 'shared:lib/spCoin/contractCompiler.ts',
      compilerBackend: 'lib/spCoin/contractCompiler.ts',
      previousReleaseDir: comparison.previousReleaseDir,
      latestReleaseDir: comparison.latestReleaseDir,
      previousFingerprint: fingerprints.previous,
      latestFingerprint: fingerprints.latest,
      report: comparison.report,
      cached: false,
    };
    await writeCachedComparison(
      comparison.previousReleaseDir,
      comparison.latestReleaseDir,
      comparison.variantFingerprints,
      payload,
    );
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to compare SPCoin contract sizes.';
    return NextResponse.json(
      {
        ok: false,
        scriptPath: 'shared:lib/spCoin/contractCompiler.ts',
        compilerBackend: 'lib/spCoin/contractCompiler.ts',
        previousReleaseDir,
        latestReleaseDir,
        message,
      },
      { status: 500 },
    );
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
        scriptPath: 'shared:lib/spCoin/contractCompiler.ts',
        compilerBackend: 'lib/spCoin/contractCompiler.ts',
        message: 'previousReleaseDir and latestReleaseDir are required.',
      },
      { status: 400 },
    );
  }

  return runComparison(previousReleaseDir, latestReleaseDir);
}
