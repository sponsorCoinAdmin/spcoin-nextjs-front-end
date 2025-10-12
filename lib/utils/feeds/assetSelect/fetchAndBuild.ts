// File: lib/utils/feeds/assetSelect/fetchAndBuild.ts
'use client';

import { FEED_TYPE } from '@/lib/structure';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import { getDataListObj } from './fallbacks';
import { buildTokenObj, buildWalletObj } from './builders';
import type { FeedData } from './types';

/** Fetch raw list (URL or fallback) and normalize into FeedData */
export async function fetchAndBuildDataList(
  feedType: FEED_TYPE,
  chainId: number
): Promise<FeedData> {
  switch (feedType) {
    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS: {
      const json = await getDataListObj(feedType, chainId);
      const accounts = await loadAccounts(json);
      return {
        feedType,
        wallets: accounts.map(buildWalletObj),
      };
    }

    case FEED_TYPE.TOKEN_LIST: {
      const list = await getDataListObj(FEED_TYPE.TOKEN_LIST, chainId);
      const tokens = await Promise.all((Array.isArray(list) ? list : []).map((t) => buildTokenObj(t, chainId)));
      return {
        feedType,
        tokens,
      };
    }

    default:
      // Keep the union exhaustive by returning an empty token list
      return { feedType: FEED_TYPE.TOKEN_LIST, tokens: [] };
  }
}
