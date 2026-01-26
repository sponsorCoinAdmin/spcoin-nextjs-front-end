// File: @/lib/utils/feeds/assetSelect/hooks/useFeedData.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { FEED_TYPE } from '@/lib/structure';
import { useAppChainId } from '@/lib/context/hooks';
import { fetchAndBuildDataList } from '../fetchAndBuildDataList';
import type { FeedData } from '../types';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false as const;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_DATALIST === 'true';

const debugLog = createDebugLogger('useFeedData', DEBUG_ENABLED, LOG_TIME);

function isAccountFeedType(feedType: FEED_TYPE) {
  return (
    feedType === FEED_TYPE.RECIPIENT_ACCOUNTS ||
    feedType === FEED_TYPE.AGENT_ACCOUNTS ||
    feedType === FEED_TYPE.SPONSOR_ACCOUNTS ||
    feedType === FEED_TYPE.MANAGE_RECIPIENTS ||
    feedType === FEED_TYPE.MANAGE_AGENTS
  );
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

    const isAccountFeed = isAccountFeedType(feedType);
    setLoading(isAccountFeed);

    debugLog.log?.('[start]', {
      seq,
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      chainId: chain,
      isAccountFeed,
    });

    (async () => {
      try {
        const data = await fetchAndBuildDataList(feedType, chain);
        const anyData: any = data;

        if (cancelled) {
          debugLog.warn?.('[cancelled-after-fetch]', { seq });
          return;
        }

        setFeedData(data);
        setError(undefined);

        debugLog.log?.('[success]', {
          seq,
          feedTypeLabel: FEED_TYPE[feedType],
          chainId: chain,

          // debug meta (if provided)
          sourceId: anyData?.__sourceId ?? '(missing __sourceId)',
          sourceKind: anyData?.__sourceKind ?? '(missing __sourceKind)',

          // ✅ SSOT: accountsXXXX only
          accountsXXXXLen: Array.isArray(anyData?.accountsXXXX) ? anyData.accountsXXXX.length : 0,

          tokensLen: Array.isArray(anyData?.tokens) ? anyData.tokens.length : 0,
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
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      debugLog.log?.('[cleanup]', { seq });
    };
  }, [feedType, chainId]);

  return { feedData, loading, error };
}
