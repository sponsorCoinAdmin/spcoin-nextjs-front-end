// File: lib/utils/feeds/assetSelect/fallbacks.ts
'use client';

import { FEED_TYPE } from '@/lib/structure';
import baseTokenListRaw from '@/resources/data/networks/base/tokenList.json';
import hardhatTokenListRaw from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenListRaw from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenListRaw from '@/resources/data/networks/sepolia/tokenList.json';
import ethereumTokenListRaw from '@/resources/data/networks/ethereum/tokenList.json';
import recipientJsonListRaw from '@/resources/data/recipients/recipientJsonList.json';
import agentJsonListRaw from '@/resources/data/agents/agentJsonList.json';
import { CHAIN_ID } from '@/lib/structure/enums/networkIds';
import { getJson } from '@/lib/rest/http';

// NOTE:
// We no longer normalize/uppercase the `address` field here. The JSON is
// consumed as-is, and any filesystem/URL case handling is centralized in
// helpers like `normalizeAddressForAssets` in assetHelpers.

const baseTokenList = baseTokenListRaw as any[];
const hardhatTokenList = hardhatTokenListRaw as any[];
const polygonTokenList = polygonTokenListRaw as any[];
const sepoliaTokenList = sepoliaTokenListRaw as any[];
const ethereumTokenList = ethereumTokenListRaw as any[];
const recipientJsonList = recipientJsonListRaw as any[];
const agentJsonList = agentJsonListRaw as any[];

/** Resolve a remote URL (if you add remote hosting later). Returning undefined means "use fallbacks". */
export function getDataListURL(
  _feedType: FEED_TYPE,
  _chainId?: number,
): string | undefined {
  // Keep this as the single place to compute URLs if/when you publish lists remotely.
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
        case CHAIN_ID.ETHEREUM:
          return ethereumTokenList as any[];
        case CHAIN_ID.BASE:
          return baseTokenList as any[];
        case CHAIN_ID.POLYGON:
          return polygonTokenList as any[];
        case CHAIN_ID.HARDHAT:
          return hardhatTokenList as any[];
        case CHAIN_ID.SEPOLIA:
          return sepoliaTokenList as any[];
        default:
          return [];
      }
    }

    default:
      return [];
  }
}

/** Read JSON either from URL (when provided) or from bundled fallbacks */
export async function getDataListObj(
  feedType: FEED_TYPE,
  chainId?: number,
): Promise<any[]> {
  const url = getDataListURL(feedType, chainId);
  if (!url) return getFallbackList(feedType, chainId);

  try {
    // Be lenient about content-type with `forceParse: true` (some hosts mislabel JSON)
    const json = await getJson<any>(url, {
      timeoutMs: 8000,
      retries: 1,
      backoffMs: 400,
      accept: 'application/json',
      forceParse: true,
    });

    // Accept either a plain array or common "{ tokens: [...] }" shapes
    if (Array.isArray(json)) return json;
    if (json && typeof json === 'object') {
      if (Array.isArray((json as any).tokens)) return (json as any).tokens;
      if (Array.isArray((json as any).items)) return (json as any).items;
    }

    // Shape unexpected → fall back
    return getFallbackList(feedType, chainId);
  } catch {
    // Network/HTTP/parse errors → fall back
    return getFallbackList(feedType, chainId);
  }
}
