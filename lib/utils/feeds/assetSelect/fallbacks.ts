// File: lib/utils/feeds/assetSelect/fallbacks.ts
'use client';

import { FEED_TYPE } from '@/lib/structure';
import baseTokenList from '@/resources/data/networks/base/tokenList.json';
import hardhatTokenList from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenList from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenList from '@/resources/data/networks/sepolia/tokenList.json';
import ethereumTokenList from '@/resources/data/networks/ethereum/tokenList.json';
import recipientJsonList from '@/resources/data/recipients/recipientJsonList.json';
import agentJsonList from '@/resources/data/agents/agentJsonList.json';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';

/** Resolve a remote URL (if you add remote hosting later). Returning undefined means "use fallbacks". */
export function getDataListURL(_feedType: FEED_TYPE, _chainId?: number): string | undefined {  // Keep this as the single place to compute URLs if/when you publish lists remotely.
  // For now, return undefined to rely on bundled JSON fallbacks.
  return undefined;
}

/** Return the bundled fallback list when remote URL is absent/unavailable */
export function getFallbackList(feedType: FEED_TYPE, chainId?: number): any[] {
  switch (feedType) {
    case FEED_TYPE.RECIPIENT_ACCOUNTS:
      return recipientJsonList as any[];

    case FEED_TYPE.AGENT_ACCOUNTS:
      return agentJsonList as any[];

    case FEED_TYPE.TOKEN_LIST: {
      switch (Number(chainId)) {
        case CHAIN_ID.ETHEREUM: return ethereumTokenList as any[];
        case CHAIN_ID.BASE:     return baseTokenList as any[];
        case CHAIN_ID.POLYGON:  return polygonTokenList as any[];
        case CHAIN_ID.HARDHAT:  return hardhatTokenList as any[];
        case CHAIN_ID.SEPOLIA:  return sepoliaTokenList as any[];
        default:                return [];
      }
    }

    default:
      return [];
  }
}

/** Read JSON either from URL (when provided) or from bundled fallbacks */
export async function getDataListObj(feedType: FEED_TYPE, chainId?: number): Promise<any[]> {
  const url = getDataListURL(feedType, chainId);
  if (!url) return getFallbackList(feedType, chainId);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch {
    return getFallbackList(feedType, chainId);
  }
}
