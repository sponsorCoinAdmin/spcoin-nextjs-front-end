// File: lib/utils/feeds/assetSelect/fallbacks.ts
'use client';

import { FEED_TYPE } from '@/lib/structure';

// 🔽 All JSON list imports are centralized here
import baseTokenList from '@/resources/data/networks/base/tokenList.json';
import hardhatTokenList from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenList from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenList from '@/resources/data/networks/sepolia/tokenList.json';
import ethereumTokenList from '@/resources/data/networks/ethereum/tokenList.json';
import recipientJsonList from '@/resources/data/recipients/recipientJsonList.json';
import agentJsonList from '@/resources/data/agents/agentJsonList.json';

import { getDataListURL } from './urlResolver';

/** Local bundled lists by type (and chain for tokens). */
export function getFallbackList(feedType: FEED_TYPE, chainId?: number): any[] {
  if (feedType === FEED_TYPE.TOKEN_LIST) {
    switch (Number(chainId)) {
      case 1: return ethereumTokenList as any[];
      case 8453: return baseTokenList as any[];
      case 137: return polygonTokenList as any[];
      case 31337: return hardhatTokenList as any[];
      case 11155111: return sepoliaTokenList as any[];
      default: return [];
    }
  }
  if (feedType === FEED_TYPE.RECIPIENT_ACCOUNTS) return recipientJsonList as any[];
  if (feedType === FEED_TYPE.AGENT_ACCOUNTS) return agentJsonList as any[];
  return [];
}

/** Prefer remote URL when available; otherwise fallback. */
export async function getDataListObj(feedType: FEED_TYPE, chainId?: number): Promise<any[]> {
  const url = getDataListURL(feedType, chainId);
  if (url) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return (await res.json()) as any[];
    } catch {
      /* fall back below */
    }
  }
  return getFallbackList(feedType, chainId);
}
