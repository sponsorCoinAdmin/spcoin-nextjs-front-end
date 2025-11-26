// File: @/lib/rest/recipientMeta.ts

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

/**
 * Fetch recipient metadata from on-disk JSON.
 *
 * IMPORTANT:
 * - We keep the original Address value for on-chain / logical usage.
 * - We only apply uppercase normalization when building public directory URLs.
 */
export async function fetchRecipientMeta(
  address: Address,
): Promise<RecipientMeta | undefined> {
  // Canonical filesystem form (0X... uppercase) for directory paths
  const normalized = normalizeAddressForAssets(address);

  // Primary location: /assets/accounts/<0X...>/wallet.json
  const primary = getWalletJsonURL(address);

  // Optional secondary base if you still use /resources/data/accounts
  const secondaryBase = '/resources/data/accounts';

  const candidates: string[] = [];

  if (primary) {
    candidates.push(primary);
  }

  if (normalized) {
    candidates.push(`${secondaryBase}/${normalized}/wallet.json`);
  }

  debugLog.log?.('[recipientMeta] candidate URLs:', candidates);

  for (const url of candidates) {
    try {
      debugLog.log?.('[recipientMeta] GET', url);
      const meta = await getJson<Partial<RecipientMeta>>(url);

      // Normalize a few common fields that UI expects
      const normalizedMeta: RecipientMeta = {
        address,
        name: (meta as any)?.name ?? (meta as any)?.title ?? '',
        symbol: (meta as any)?.symbol ?? '',
        website: (meta as any)?.website ?? '',
        logoURL:
          (meta as any)?.logoURL ??
          // Centralized helper: builds /assets/accounts/<0X...>/logo.png
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
