// File: @/lib/utils/feeds/assetSelect/fetchAndBuildDataList.ts
'use client';

import { FEED_TYPE } from '@/lib/structure';
import { getDataListObj } from './fallbacks';
import type { FeedData } from './types';

// ✅ Helpers from builders.ts
import {
  feedDataFromJson,           // builds full FeedData from raw JSON (async)
  buildTokenFromJson,         // build a single token from raw JSON
  buildWalletFromJsonFirst,   // build the first wallet from a spec (via loadAccounts)
} from './builders';

// ✅ Management JSON placeholders (temporary stand-ins for on-chain reads)
import sponsorsJson from '@/components/views/ManageSponsorships/sponsors.json';
import recipientsJson from '@/components/views/ManageSponsorships/recipients.json';
import agentsJson from '@/components/views/ManageSponsorships/agents.json';

const DEBUG_FEEDS =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true';

function logFeed(label: string, feedType: FEED_TYPE, built: FeedData) {
  if (!DEBUG_FEEDS) return;
  const walletsLen = Array.isArray((built as any).wallets)
    ? (built as any).wallets.length
    : 0;
  const tokensLen = Array.isArray((built as any).tokens)
    ? (built as any).tokens.length
    : 0;
  // eslint-disable-next-line no-console
  console.log('[assetSelect][fetchAndBuild]', label, {
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    walletsLen,
    tokensLen,
  });
}

/** Fetch raw list/spec (URL or fallback) and normalize via builders → FeedData */
export async function fetchAndBuildDataList(
  feedType: FEED_TYPE,
  chainId: number
): Promise<FeedData> {
  // 🔹 Management feeds: use dedicated JSON specs for now
  if (
    feedType === FEED_TYPE.SPONSOR_ACCOUNTS ||
    feedType === FEED_TYPE.MANAGE_RECIPIENTS ||
    feedType === FEED_TYPE.MANAGE_AGENTS
  ) {
    const raw =
      feedType === FEED_TYPE.SPONSOR_ACCOUNTS
        ? sponsorsJson
        : feedType === FEED_TYPE.MANAGE_RECIPIENTS
        ? recipientsJson
        : agentsJson;

    // Normalize MANAGE_* → an existing account-style feed type so builders
    // interpret the JSON as wallet accounts.
    const ACCOUNT_STYLE_FEED = FEED_TYPE.RECIPIENT_ACCOUNTS;

    const built = await feedDataFromJson(ACCOUNT_STYLE_FEED, chainId, raw);
    logFeed('fetchAndBuildDataList', feedType, built);
    return built;
  }

  // 🔹 Default path: URL/fallback-driven spec
  const jsonSpec = await getDataListObj(feedType, chainId);
  const built = await feedDataFromJson(feedType, chainId, jsonSpec);
  logFeed('default', feedType, built);
  return built;
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
  // Treat MANAGE_* like account feeds for "first wallet" convenience
  if (
    feedType === FEED_TYPE.SPONSOR_ACCOUNTS ||
    feedType === FEED_TYPE.MANAGE_RECIPIENTS ||
    feedType === FEED_TYPE.MANAGE_AGENTS
  ) {
    const raw =
      feedType === FEED_TYPE.SPONSOR_ACCOUNTS
        ? sponsorsJson
        : feedType === FEED_TYPE.MANAGE_RECIPIENTS
        ? recipientsJson
        : agentsJson;

    const first = await buildWalletFromJsonFirst(raw);
    if (DEBUG_FEEDS) {
      // eslint-disable-next-line no-console
      console.log('[assetSelect][fetchSingleFromSource] manage', {
        feedType,
        feedTypeLabel: FEED_TYPE[feedType],
        hasWallet: !!first,
        addr: (first as any)?.address ?? null,
      });
    }
    return first;
  }

  const jsonSpec = await getDataListObj(feedType, chainId);

  switch (feedType) {
    case FEED_TYPE.TOKEN_LIST: {
      const arr = Array.isArray(jsonSpec) ? jsonSpec : (jsonSpec ? [jsonSpec] : []);
      const first = arr[0] ?? null;
      const built = first ? buildTokenFromJson(first, chainId) : null;
      if (DEBUG_FEEDS) {
        // eslint-disable-next-line no-console
        console.log('[assetSelect][fetchSingleFromSource] TOKEN_LIST', {
          hasToken: !!built,
        });
      }
      return built;
    }

    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS: {
      const first = await buildWalletFromJsonFirst(jsonSpec);
      if (DEBUG_FEEDS) {
        // eslint-disable-next-line no-console
        console.log('[assetSelect][fetchSingleFromSource] account feed', {
          feedType,
          feedTypeLabel: FEED_TYPE[feedType],
          hasWallet: !!first,
          addr: (first as any)?.address ?? null,
        });
      }
      return first;
    }

    default:
      if (DEBUG_FEEDS) {
        // eslint-disable-next-line no-console
        console.log('[assetSelect][fetchSingleFromSource] unsupported', {
          feedType,
          feedTypeLabel: FEED_TYPE[feedType],
        });
      }
      return null;
  }
}
