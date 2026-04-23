import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

import { compareSpCoinContractSizes, getSpCoinSourceFingerprint } from '@/lib/spCoin/contractCompiler';

export const runtime = 'nodejs';

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
