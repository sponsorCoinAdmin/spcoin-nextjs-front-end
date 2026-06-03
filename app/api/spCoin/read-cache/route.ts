import { NextResponse } from 'next/server';
import {
  clearReadCache,
  getReadCacheSize,
} from '@/spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/readCache';

export async function POST() {
  const beforeSize = getReadCacheSize();
  clearReadCache();
  return NextResponse.json({
    ok: true,
    beforeSize,
    afterSize: getReadCacheSize(),
  });
}
