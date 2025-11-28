// File: @/lib/utils/feeds/assetSelect/useFeedData.ts
'use client';

import { useEffect, useState } from 'react';
import { FEED_TYPE } from '@/lib/structure';
import { useAppChainId } from '@/lib/context/hooks';
import { fetchAndBuildDataList } from '../fetchAndBuild';
import type { FeedData } from '../types';

export function useFeedData(feedType: FEED_TYPE) {
  const [chainId] = useAppChainId();
  const [feedData, setFeedData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    // Spinner for account-like feeds (including manage views)
    const isAccountFeed =
      feedType === FEED_TYPE.RECIPIENT_ACCOUNTS ||
      feedType === FEED_TYPE.AGENT_ACCOUNTS ||
      feedType === FEED_TYPE.MANAGE_SPONSORS ||
      feedType === FEED_TYPE.MANAGE_RECIPIENTS ||
      feedType === FEED_TYPE.MANAGE_AGENTS;

    setLoading(isAccountFeed);

    (async () => {
      try {
        const data = await fetchAndBuildDataList(feedType, Number(chainId));
        if (!cancelled) {
          setFeedData(data);
          setError(undefined);
        }
      } catch (e: any) {
        if (!cancelled) {
          setFeedData(null);
          setError(e?.message ?? 'Failed to get feed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [feedType, chainId]);

  return { feedData, loading, error };
}
