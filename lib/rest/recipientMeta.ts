// File: lib/rest/recipientMeta.ts

import type { Address } from 'viem';
import { getJson } from './http';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import {
  getWalletJsonURL,
  getWalletLogoURL,
  normalizeAddressForAssets,
} from '@/lib/context/helpers/assetHelpers';

const LOG_TIME: boolean = false;
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

export async function fetchRecipientMeta(
  address: Address,
): Promise<RecipientMeta | undefined> {
  const normalized = normalizeAddressForAssets(address); // UPPERCASE for disk

  // Primary: canonical JSON path via helper (uses /assets/accounts/<UPPER>/wallet.json)
  const candidates: string[] = [];
  const canonicalJson = getWalletJsonURL(address);
  if (canonicalJson) {
    candidates.push(canonicalJson);
  }

  // Optional legacy/fallback locations if they still exist
  if (normalized) {
    candidates.push(`/assets/accounts/${normalized}/wallet.json`);
    candidates.push(`/resources/data/accounts/${normalized}/wallet.json`);
  }

  debugLog.log?.('[recipientMeta] candidate URLs:', candidates);

  for (const url of candidates) {
    try {
      debugLog.log?.('[recipientMeta] GET', url);
      const meta = await getJson<Partial<RecipientMeta>>(url);

      // Normalize fields the UI expects
      const normalizedMeta: RecipientMeta = {
        address,
        name: (meta as any)?.name ?? (meta as any)?.title ?? '',
        symbol: (meta as any)?.symbol ?? '',
        website: (meta as any)?.website ?? '',
        logoURL:
          (meta as any)?.logoURL ??
          // Use centralized helper so disk case is always correct
          getWalletLogoURL(address),
      };

      return normalizedMeta;
    } catch (err: any) {
      debugLog.log?.('[recipientMeta] ❌ failed', url, err?.message ?? err);
      // keep trying next candidate
    }
  }

  debugLog.log?.('[recipientMeta] no candidates succeeded');
  return undefined;
}
