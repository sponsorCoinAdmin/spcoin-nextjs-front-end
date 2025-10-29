// File: lib/rest/recipientMeta.ts
import type { Address } from 'viem';
import { getAddress } from 'viem';
import { getJson } from './http';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_RECIPIENT_META === 'true';
const debugLog = createDebugLogger('recipientMeta', DEBUG_ENABLED, LOG_TIME);

export type RecipientMeta = {
  address: Address;
  name?: string;
  symbol?: string;
  website?: string;
  logoURL?: string;
  // add any other fields your wallet.json may include
};

function toChecksum(addr: string): string {
  try {
    // Prefer viem’s checksum if available
    return getAddress(addr as Address);
  } catch {
    // Fall back to given input if it’s already checksum’d
    return addr;
  }
}

export async function fetchRecipientMeta(address: Address): Promise<RecipientMeta | undefined> {
  const checksum = toChecksum(address);
  const lower = address.toLowerCase(); // keep as string for URL building

  // ✅ correct bases for where your files actually live
  const bases = [
    '/assets/accounts',
    '/resources/data/accounts', // optional fallback if you use it
  ];

  // ✅ you only serve wallet.json (no account.json)
  const filenames = ['wallet.json'];

  // Generate candidate URLs (checksum form first, then lowercase)
  const candidates: string[] = [];
  for (const base of bases) {
    for (const file of filenames) {
      candidates.push(`${base}/${checksum}/${file}`);
      candidates.push(`${base}/${lower}/${file}`);
    }
  }

  debugLog.log?.('[recipientMeta] candidate URLs:', candidates);

  for (const url of candidates) {
    try {
      debugLog.log?.('[recipientMeta] GET', url);
      const meta = await getJson<Partial<RecipientMeta>>(url);

      // Normalize a few common fields that UI expects
      const normalized: RecipientMeta = {
        address,
        name: (meta as any)?.name ?? (meta as any)?.title ?? '',
        symbol: (meta as any)?.symbol ?? '',
        website: (meta as any)?.website ?? '',
        logoURL:
          (meta as any)?.logoURL ??
          `/assets/accounts/${checksum}/logo.png`,
      };

      return normalized;
    } catch (err: any) {
      debugLog.log?.('[recipientMeta] ❌ failed', url, err?.message ?? err);
      // keep trying next candidate
    }
  }

  debugLog.log?.('[recipientMeta] no candidates succeeded');
  return undefined;
}
