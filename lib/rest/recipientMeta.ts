// File: @/lib/rest/recipientMeta.ts
import type { Address } from 'viem';
import { getAccountByAddress } from '@/lib/api';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getWalletLogoURL } from '@/lib/context/helpers/assetHelpers';

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
    const response = await getAccountByAddress<Partial<RecipientMeta>>(address);
    const meta = response?.data;

    return {
      address,
      name: (meta as any)?.name ?? (meta as any)?.title ?? '',
      symbol: (meta as any)?.symbol ?? '',
      website: (meta as any)?.website ?? '',
      logoURL: (meta as any)?.logoURL ?? getWalletLogoURL(address),
    };
  } catch (err: any) {
    debugLog.log?.('[recipientMeta] failed', String(err?.message ?? err));
    return undefined;
  }
}
