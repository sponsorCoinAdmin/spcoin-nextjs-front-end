// File: lib/rest/recipientMeta.ts

import type { Address } from 'viem';
import { getAddress } from 'viem';
import { getJson } from './http';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_RECIPIENT_META === 'true';
const debugLog = createDebugLogger('recipientMeta', DEBUG_ENABLED, LOG_TIME);

export type RecipientMeta = {
  address: Address;
  name?: string;
  symbol?: string;
  website?: string;
  logoURL?: string;
};

// simple in-memory cache to avoid repeated fetches / React blasting
// key = checksum-lowercased; value = meta or null if not found
const metaCache = new Map<string, RecipientMeta | null>();

function toChecksum(addr: string): string {
  try {
    return getAddress(addr as Address);
  } catch {
    return addr;
  }
}

export async function fetchRecipientMeta(
  address: Address,
): Promise<RecipientMeta | undefined> {
  const checksum = toChecksum(address);
  const lower = address.toLowerCase(); // legacy lowercase directory fallback
  const upper = checksum.toUpperCase(); // primary: matches uppercased dirs on Linux
  const cacheKey = checksum.toLowerCase();

  // 🔒 cache guard
  if (metaCache.has(cacheKey)) {
    const cached = metaCache.get(cacheKey);
    debugLog.log?.('[recipientMeta] cache hit for', cacheKey, '→', cached);
    if (cached === null) return undefined;
    return cached;
  }

  // Only use the public assets tree — no /resources/data/accounts over HTTP
  const base = '/assets/accounts';
  const filename = 'wallet.json';

  const candidates = [
    // Primary: uppercased directory (what your build-script now produces)
    `${base}/${upper}/${filename}`,
    // Legacy fallbacks (checksum-cased and lowercase), in case some dirs weren't migrated
    `${base}/${checksum}/${filename}`,
    `${base}/${lower}/${filename}`,
  ];

  debugLog.log?.('[recipientMeta] candidate URLs:', candidates);

  for (const url of candidates) {
    try {
      debugLog.log?.('[recipientMeta] GET', url);
      const meta = await getJson<Partial<RecipientMeta>>(url);

      const logoFsKey = checksum.toUpperCase();

      const normalized: RecipientMeta = {
        address,
        name: (meta as any)?.name ?? (meta as any)?.title ?? '',
        symbol: (meta as any)?.symbol ?? '',
        website: (meta as any)?.website ?? '',
        logoURL:
          (meta as any)?.logoURL ??
          // default logo path; your wallet.json can override this
          `${base}/${logoFsKey}/logo.png`,
      };

      metaCache.set(cacheKey, normalized);
      return normalized;
    } catch (err: any) {
      debugLog.log?.(
        '[recipientMeta] ❌ failed',
        url,
        err?.message ?? err,
      );
      // continue to next candidate
    }
  }

  debugLog.log?.('[recipientMeta] no candidates succeeded for', cacheKey);
  metaCache.set(cacheKey, null); // remember failure
  return undefined;
}
