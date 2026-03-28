import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const SPCOIN_ABI_PATH = path.join(process.cwd(), 'resources', 'data', 'ABIs', 'spcoinABI.json');

export async function GET() {
  try {
    const raw = await fs.readFile(SPCOIN_ABI_PATH, 'utf8');
    const abi = JSON.parse(raw) as unknown;
    if (!Array.isArray(abi)) {
      return NextResponse.json({ ok: false, message: 'SPCoin ABI file is not an array.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      abi,
      entryCount: abi.length,
      abiPath: SPCOIN_ABI_PATH,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Unable to load SPCoin ABI.',
      },
      { status: 500 },
    );
  }
}
