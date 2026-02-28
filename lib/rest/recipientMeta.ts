// File: @/lib/rest/recipientMeta.ts
import type { Address } from 'viem';
import { loadAccountRecord } from '@/lib/context/accounts/accountStore';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getAccountLogoURL } from '@/lib/context/helpers/assetHelpers';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_RECIPIENT_META === 'true';
const debugLog = createDebugLogger('recipientMeta', DEBUG_ENABLED, LOG_TIME);

export type RecipientMeta = {
  address: Address;
  name?: string;
  symbol?: string;
  website?: string;
  logoURL?: string;
};

export async function fetchRecipientMeta(
  address: Address,
): Promise<RecipientMeta | undefined> {
  try {
    debugLog.log?.('[recipientMeta] GET', `/api/spCoin/accounts/${address}`);
    const meta = await loadAccountRecord(address);

    return {
      address,
      name: (meta as any)?.name ?? (meta as any)?.title ?? '',
      symbol: (meta as any)?.symbol ?? '',
      website: (meta as any)?.website ?? '',
      logoURL: (meta as any)?.logoURL ?? getAccountLogoURL(address),
    };
  } catch (err: any) {
    debugLog.log?.('[recipientMeta] failed', String(err?.message ?? err));
    return undefined;
  }
}
