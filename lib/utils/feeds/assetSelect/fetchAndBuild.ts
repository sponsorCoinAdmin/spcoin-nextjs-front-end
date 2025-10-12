// File: lib/utils/feeds/assetSelect/fetchAndBuild.ts
'use client';

import { FEED_TYPE, WalletAccount } from '@/lib/structure';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import { getDataListObj } from './fallbacks';
import { buildTokenObj, buildWalletObj } from './builders';

export async function fetchAndBuildDataList(
  feedType: FEED_TYPE,
  chainId: number
): Promise<{ wallets?: WalletAccount[]; tokens?: any[] }> {
  switch (feedType) {
    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS: {
      const json = await getDataListObj(feedType, chainId);
      const accounts = await loadAccounts(json);
      return { wallets: accounts.map(buildWalletObj) };
    }

    case FEED_TYPE.TOKEN_LIST: {
      const list = await getDataListObj(FEED_TYPE.TOKEN_LIST, chainId);
      const tokens = await Promise.all((Array.isArray(list) ? list : []).map((t) => buildTokenObj(t, chainId)));
      return { tokens };
    }

    default:
      return {};
  }
}
