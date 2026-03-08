// File: lib/rest/recipientMeta.ts
import type { Address } from 'viem';
import { loadAccountRecord } from '@/lib/context/accounts/accountStore';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getAccountLogoURL } from '@/lib/context/helpers/assetHelpers';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_RECIPIENT_META === 'true';
const debugLog = createDebugLogger('recipientMeta', DEBUG_ENABLED, LOG_TIME);

export interface RecipientMeta {
  address: Address;
  name?: string;
  symbol?: string;
  website?: string;
  logoURL?: string;
}

interface RecipientMetaRecord {
  name?: unknown;
  title?: unknown;
  symbol?: unknown;
  website?: unknown;
  logoURL?: unknown;
}

export async function fetchRecipientMeta(
  address: Address,
): Promise<RecipientMeta | undefined> {
  try {
    debugLog.log?.('[recipientMeta] GET', `/api/spCoin/accounts/${address}`);
    const meta = (await loadAccountRecord(address)) as RecipientMetaRecord | undefined;
    const name =
      typeof meta?.name === 'string'
        ? meta.name
        : typeof meta?.title === 'string'
          ? meta.title
          : '';
    const symbol = typeof meta?.symbol === 'string' ? meta.symbol : '';
    const website = typeof meta?.website === 'string' ? meta.website : '';
    const logoURL = typeof meta?.logoURL === 'string' ? meta.logoURL : getAccountLogoURL(address);

    return {
      address,
      name,
      symbol,
      website,
      logoURL,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    debugLog.log?.('[recipientMeta] failed', message);
    return undefined;
  }
}
