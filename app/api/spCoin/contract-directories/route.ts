import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const baseDir = path.join(process.cwd(), 'spCoinAccess', 'contracts');

  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const directories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        label: entry.name,
        value: path.posix.join('spCoinAccess', 'contracts', entry.name).replace(/\\/g, '/'),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

    return NextResponse.json({
      ok: true,
      baseDirectory: 'spCoinAccess/contracts',
      directories,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to list contract directories.';
    return NextResponse.json(
      {
        ok: false,
        baseDirectory: 'spCoinAccess/contracts',
        message,
      },
      { status: 500 },
    );
  }
}
