'use client';

import { FEED_TYPE } from '@/lib/structure';
import type { WalletAccount } from '@/lib/structure';

// Used by TokenListItem and DataListSelect
export type BuiltToken = {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  chainId?: number;
  logoURL?: string;
};

// ✅ Expand union to include SPONSOR + manage feeds
export type AccountFeedType =
  | FEED_TYPE.RECIPIENT_ACCOUNTS
  | FEED_TYPE.AGENT_ACCOUNTS
  | FEED_TYPE.SPONSOR_ACCOUNTS
  | FEED_TYPE.MANAGE_RECIPIENTS
  | FEED_TYPE.MANAGE_AGENTS;

export type TokenFeedType = FEED_TYPE.TOKEN_LIST;

// ✅ Optional debug metadata we can attach without breaking UI
export type FeedDebugMeta = {
  sourceId?: string;        // e.g. "@/resources/data/sponsors/accounts.json"
  sourceKind?: string;      // e.g. "bundled-resource" | "manage-json" | "remote-url"
  resolvedUrl?: string;     // if remote later
};

export type FeedData =
  | ({ feedType: TokenFeedType; tokens: BuiltToken[] } & { __debug?: FeedDebugMeta })
  | ({ feedType: AccountFeedType; wallets: WalletAccount[] } & { __debug?: FeedDebugMeta });
