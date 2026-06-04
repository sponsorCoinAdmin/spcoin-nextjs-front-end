import { NextResponse } from 'next/server';
import { clearCache } from '@/spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/readCache';

export async function POST() {
  const result = clearCache();
  return NextResponse.json({
    ok: true,
    ...result,
    beforeSize: result.entriesBefore,
    afterSize: result.entriesAfter,
  });
}
