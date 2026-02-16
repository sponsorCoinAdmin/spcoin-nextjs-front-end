// File: @/lib/utils/feeds/assetSelect/hooks/useFeedData.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { FEED_TYPE, type FeedData } from '@/lib/structure';
import { useAppChainId } from '@/lib/context/hooks';
import { fetchAndBuildDataList } from '../fetchAndBuildDataList';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false as const;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_DATALIST === 'true';

const debugLog = createDebugLogger('useFeedData', DEBUG_ENABLED, LOG_TIME);

type CacheEntry = {
  data: FeedData;
  expiresAt: number;
};

const DEFAULT_FEED_CACHE_TTL_MS = 60_000;

function parsePositiveMsEnv(name: string): number | undefined {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : undefined;
}

const FEED_CACHE_TTL_MS = parsePositiveMsEnv('NEXT_PUBLIC_ASSET_SELECT_FEED_TTL_MS') ?? DEFAULT_FEED_CACHE_TTL_MS;
const ACCOUNT_FEED_CACHE_TTL_MS =
  parsePositiveMsEnv('NEXT_PUBLIC_ASSET_SELECT_ACCOUNT_FEED_TTL_MS') ?? FEED_CACHE_TTL_MS;
const TOKEN_FEED_CACHE_TTL_MS =
  parsePositiveMsEnv('NEXT_PUBLIC_ASSET_SELECT_TOKEN_FEED_TTL_MS') ?? FEED_CACHE_TTL_MS;

const feedCache = new Map<string, CacheEntry>();
const inFlightFeedRequests = new Map<string, Promise<FeedData>>();

function isAccountFeedType(feedType: FEED_TYPE) {
  return (
    feedType === FEED_TYPE.RECIPIENT_ACCOUNTS ||
    feedType === FEED_TYPE.AGENT_ACCOUNTS ||
    feedType === FEED_TYPE.SPONSOR_ACCOUNTS ||
    feedType === FEED_TYPE.MANAGE_RECIPIENTS ||
    feedType === FEED_TYPE.MANAGE_AGENTS
  );
}

function getCacheKey(feedType: FEED_TYPE, chainId: number) {
  return `${feedType}:${chainId}`;
}

function ttlForFeedType(feedType: FEED_TYPE): number {
  return isAccountFeedType(feedType) ? ACCOUNT_FEED_CACHE_TTL_MS : TOKEN_FEED_CACHE_TTL_MS;
}

export function useFeedData(feedType: FEED_TYPE) {
  const [chainId] = useAppChainId();
  const [feedData, setFeedData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();
  const seqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const seq = ++seqRef.current;
    const chain = Number(chainId);
    const key = getCacheKey(feedType, chain);
    const now = Date.now();
    const ttlMs = ttlForFeedType(feedType);

    const isAccountFeed = isAccountFeedType(feedType);
    const cached = feedCache.get(key);
    const isFresh = !!cached && cached.expiresAt > now;

    if (isFresh) {
      setFeedData(cached.data);
      setError(undefined);
      setLoading(false);

      debugLog.log?.('[cache-hit]', {
        seq,
        key,
        feedType,
        feedTypeLabel: FEED_TYPE[feedType],
        chainId: chain,
        ttlMs,
        expiresInMs: cached.expiresAt - now,
      });

      return () => {
        cancelled = true;
        debugLog.log?.('[cleanup]', { seq, key, source: 'cache-hit' });
      };
    }

    setLoading(isAccountFeed);

    debugLog.log?.('[start]', {
      seq,
      key,
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      chainId: chain,
      isAccountFeed,
      ttlMs,
      cacheState: cached ? 'expired' : 'miss',
    });

    (async () => {
      try {
        let request = inFlightFeedRequests.get(key);
        if (!request) {
          request = fetchAndBuildDataList(feedType, chain);
          inFlightFeedRequests.set(key, request);
        }

        const data = await request;
        const anyData: any = data;

        if (cancelled) {
          debugLog.warn?.('[cancelled-after-fetch]', { seq });
          return;
        }

        feedCache.set(key, {
          data,
          expiresAt: Date.now() + ttlMs,
        });

        setFeedData(data);
        setError(undefined);

        debugLog.log?.('[success]', {
          seq,
          key,
          feedTypeLabel: FEED_TYPE[feedType],
          chainId: chain,

          // debug meta (if provided)
          sourceId: anyData?.__sourceId ?? '(missing __sourceId)',
          sourceKind: anyData?.__sourceKind ?? '(missing __sourceKind)',

          // ✅ SSOT: spCoinAccounts only
          spCoinAccountsLen: Array.isArray(anyData?.spCoinAccounts) ? anyData.spCoinAccounts.length : 0,

          tokensLen: Array.isArray(anyData?.tokens) ? anyData.tokens.length : 0,
          ttlMs,
        });
      } catch (e: any) {
        if (cancelled) return;
        setFeedData(null);
        setError(e?.message ?? 'Failed to get feed');
        debugLog.error?.('[error]', {
          seq,
          feedTypeLabel: FEED_TYPE[feedType],
          chainId: chain,
          message: e?.message ?? String(e),
        });
      } finally {
        inFlightFeedRequests.delete(key);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      debugLog.log?.('[cleanup]', { seq, key, source: 'network' });
    };
  }, [feedType, chainId]);

  return { feedData, loading, error };
}
