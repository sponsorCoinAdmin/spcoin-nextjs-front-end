import { NextResponse } from 'next/server';
import {
  listSpCoinContractDirectories,
  SPCOIN_CONTRACTS_BASE_DIRECTORY,
} from '@/lib/spCoinLab/contractDirectories';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const directories = await listSpCoinContractDirectories();

    return NextResponse.json({
      ok: true,
      baseDirectory: SPCOIN_CONTRACTS_BASE_DIRECTORY,
      directories,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to list contract directories.';
    return NextResponse.json(
      {
        ok: false,
        baseDirectory: SPCOIN_CONTRACTS_BASE_DIRECTORY,
        message,
      },
      { status: 500 },
    );
  }
}
