// File: @/lib/utils/feeds/assetSelect/urlResolver.ts
'use client';

import { FEED_TYPE } from '@/lib/structure';

/**
 * Resolve a remote URL for a given feed type & chain.
 * Return null to force local fallback.
 */
export function getDataListURL(feedType: FEED_TYPE, chainId?: number): string | null {
  switch (feedType) {
    case FEED_TYPE.TOKEN_LIST: {
      if (typeof chainId !== 'number') return null;
      // TODO: If you host token lists, return the proper URL here.
      return null;
    }
    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS:
      // Using bundled lists for now.
      return null;
    default:
      return null;
  }
}
