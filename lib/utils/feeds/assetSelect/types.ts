// File: lib/utils/feeds/assetSelect/types.ts
'use client';

import type { FEED_TYPE, WalletAccount } from '@/lib/structure';

/** Normalized token shape consumed by the list UI */
export type BuiltToken = {
  name: string;
  symbol: string;
  address: string;
  logoURL: string;
  // keep room for extra fields without breaking
  [k: string]: any;
};

/** Discriminated union returned by /build services */
export type FeedData =
  | {
      feedType: FEED_TYPE.RECIPIENT_ACCOUNTS | FEED_TYPE.AGENT_ACCOUNTS;
      wallets: WalletAccount[];
    }
  | {
      feedType: FEED_TYPE.TOKEN_LIST;
      tokens: BuiltToken[];
    };
