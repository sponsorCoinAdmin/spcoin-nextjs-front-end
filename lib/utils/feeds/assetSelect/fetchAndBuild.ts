// File: @/lib/utils/feeds/assetSelect/fetchAndBuild.ts
'use client';

import { FEED_TYPE } from '@/lib/structure';
import { getDataListObj } from './fallbacks';
import type { FeedData } from './types';

// ✅ New helpers from builders.ts
import {
  feedDataFromJson,           // builds full FeedData from raw JSON
  buildTokenFromJson,         // build a single token from raw JSON
  buildWalletFromJsonFirst,   // build the first wallet from a spec (via loadAccounts)
} from './builders';

/** Fetch raw list/spec (URL or fallback) and normalize via builders → FeedData */
export async function fetchAndBuildDataList(
  feedType: FEED_TYPE,
  chainId: number
): Promise<FeedData> {
  // Pull the spec the same way as before
  const jsonSpec = await getDataListObj(feedType, chainId);

  // Hand off to the unified converter (most efficient / least duplication)
  return feedDataFromJson(feedType, chainId, jsonSpec);
}

/**
 * (Optional) Convenience: get a source and return a single normalized item.
 * - TOKEN_LIST → one BuiltToken (from first/only item)
 * - *_ACCOUNTS → first WalletAccount (or null if none)
 */
export async function fetchSingleFromSource(
  feedType: FEED_TYPE,
  chainId: number
) {
  const jsonSpec = await getDataListObj(feedType, chainId);

  switch (feedType) {
    case FEED_TYPE.TOKEN_LIST: {
      // Accept single object or array; pick the first
      const arr = Array.isArray(jsonSpec) ? jsonSpec : (jsonSpec ? [jsonSpec] : []);
      const first = arr[0] ?? null;
      return first ? buildTokenFromJson(first, chainId) : null;
    }

    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS: {
      return buildWalletFromJsonFirst(jsonSpec);
    }

    default:
      return null;
  }
}
