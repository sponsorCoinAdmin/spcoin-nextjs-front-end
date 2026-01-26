// File: @/lib/utils/feeds/assetSelect/fetchAndBuildDataList.ts
'use client';

import { FEED_TYPE } from '@/lib/structure';
import type { FeedData } from './types';

// ✅ Helpers from builders.ts
import { feedDataFromJson, buildTokenFromJson, buildWalletFromJsonFirst } from './builders';

// ✅ Management JSON placeholders (temporary stand-ins for on-chain reads)
import sponsorsJson from '@/resources/data/spCoinMockTokenRequest/ManageSponsorships/sponsors.json';
import recipientsJson from '@/resources/data/spCoinMockTokenRequest/ManageSponsorships/recipients.json';
import agentsJson from '@/resources/data/spCoinMockTokenRequest/ManageSponsorships/agents.json';

// ✅ Bundled fallbacks
import baseTokenListRaw from '@/resources/data/networks/base/tokenList.json';
import hardhatTokenListRaw from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenListRaw from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenListRaw from '@/resources/data/networks/sepolia/tokenList.json';
import ethereumTokenListRaw from '@/resources/data/networks/ethereum/tokenList.json';

import recipientJsonListRaw from '@/resources/data/recipients/accounts.json';
import agentJsonListRaw from '@/resources/data/agents/accounts.json';
import sponsorJsonListRaw from '@/resources/data/sponsors/accounts.json';

import { CHAIN_ID } from '@/lib/structure/enums/networkIds';
import { getJson } from '@/lib/rest/http';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false as const;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true';

const debugLog = createDebugLogger('fetchAndBuildDataList', DEBUG_ENABLED, LOG_TIME);

// Simple call counter so you can correlate logs across renders
let CALL_SEQ = 0;

/** Give every bundled JSON import a stable identifier string for debugLogs. */
const SOURCES = {
  accounts: {
    recipients: '@/resources/data/recipients/accounts.json',
    agents: '@/resources/data/agents/accounts.json',
    sponsors: '@/resources/data/sponsors/accounts.json',
  },
  manage: {
    recipients: '@/components/views/ManageSponsorships/recipients.json',
    agents: '@/components/views/ManageSponsorships/agents.json',
    sponsors: '@/components/views/ManageSponsorships/sponsors.json',
  },
  tokenLists: {
    ethereum: '@/resources/data/networks/ethereum/tokenList.json',
    base: '@/resources/data/networks/base/tokenList.json',
    polygon: '@/resources/data/networks/polygon/tokenList.json',
    hardhat: '@/resources/data/networks/hardhat/tokenList.json',
    sepolia: '@/resources/data/networks/sepolia/tokenList.json',
  },
} as const;

type SourceKind = 'manage-json' | 'bundled-fallback' | 'remote-url';

type SelectedSource = {
  sourceId: string;
  sourceKind: SourceKind;
};

// ──────────────────────────────────────────────────────────────────────────────
// Fallback data
// ──────────────────────────────────────────────────────────────────────────────

const baseTokenList = baseTokenListRaw as any[];
const hardhatTokenList = hardhatTokenListRaw as any[];
const polygonTokenList = polygonTokenListRaw as any[];
const sepoliaTokenList = sepoliaTokenListRaw as any[];
const ethereumTokenList = ethereumTokenListRaw as any[];

const recipientJsonSource = recipientJsonListRaw as any;
const agentJsonSource = agentJsonListRaw as any;
const sponsorJsonSource = sponsorJsonListRaw as any;

function normalizeList(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.wallets)) return raw.wallets;
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.accounts)) return raw.accounts;
    if (Array.isArray(raw.recipients)) return raw.recipients;
    if (Array.isArray(raw.agents)) return raw.agents;
    if (Array.isArray(raw.sponsors)) return raw.sponsors;
  }
  return [];
}

function summarize(raw: any) {
  if (Array.isArray(raw)) return { kind: 'array', length: raw.length };
  if (raw && typeof raw === 'object') return { kind: 'object', keys: Object.keys(raw).slice(0, 25) };
  return { kind: String(raw) };
}

/** Peek at first few entries to confirm what list is actually being used. */
function previewList(list: any[], max = 5) {
  const slice = list.slice(0, max);
  return slice.map((x) => {
    if (!x || typeof x !== 'object') return x;
    return {
      // most important “where do we go next?” fields
      address: (x as any).address ?? (x as any).addr ?? (x as any).wallet ?? (x as any).id,
      file: (x as any).file,
      url: (x as any).url,
      // human fields
      name: (x as any).name,
      symbol: (x as any).symbol,
      // expansion hints
      inline: Array.isArray((x as any).inline) ? `inline[${(x as any).inline.length}]` : undefined,
      accounts: Array.isArray((x as any).accounts) ? `accounts[${(x as any).accounts.length}]` : undefined,
      wallets: Array.isArray((x as any).wallets) ? `wallets[${(x as any).wallets.length}]` : undefined,
    };
  });
}

/** Resolve a remote URL (if you add remote hosting later). Returning undefined means "use fallbacks". */
function getDataListURL(_feedType: FEED_TYPE, _chainId?: number): string | undefined {
  // If you later add env overrides, log them here.
  return undefined;
}

/**
 * Return the bundled fallback list when remote URL is absent/unavailable.
 * ALSO returns "sourceId" so debugLogs can name the exact JSON module selected.
 */
function getFallbackListWithSource(
  feedType: FEED_TYPE,
  chainId?: number
): { sourceId: string; sourceKind: 'bundled-fallback'; list: any[] } {
  switch (feedType) {
    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.MANAGE_RECIPIENTS: {
      const list = normalizeList(recipientJsonSource);
      return { sourceId: SOURCES.accounts.recipients, sourceKind: 'bundled-fallback', list };
    }

    case FEED_TYPE.AGENT_ACCOUNTS:
    case FEED_TYPE.MANAGE_AGENTS: {
      const list = normalizeList(agentJsonSource);
      return { sourceId: SOURCES.accounts.agents, sourceKind: 'bundled-fallback', list };
    }

    case FEED_TYPE.SPONSOR_ACCOUNTS: {
      const list = normalizeList(sponsorJsonSource);
      return { sourceId: SOURCES.accounts.sponsors, sourceKind: 'bundled-fallback', list };
    }

    case FEED_TYPE.TOKEN_LIST: {
      switch (Number(chainId)) {
        case CHAIN_ID.ETHEREUM:
          return { sourceId: SOURCES.tokenLists.ethereum, sourceKind: 'bundled-fallback', list: ethereumTokenList as any[] };
        case CHAIN_ID.BASE:
          return { sourceId: SOURCES.tokenLists.base, sourceKind: 'bundled-fallback', list: baseTokenList as any[] };
        case CHAIN_ID.POLYGON:
          return { sourceId: SOURCES.tokenLists.polygon, sourceKind: 'bundled-fallback', list: polygonTokenList as any[] };
        case CHAIN_ID.HARDHAT:
          return { sourceId: SOURCES.tokenLists.hardhat, sourceKind: 'bundled-fallback', list: hardhatTokenList as any[] };
        case CHAIN_ID.SEPOLIA:
          return { sourceId: SOURCES.tokenLists.sepolia, sourceKind: 'bundled-fallback', list: sepoliaTokenList as any[] };
        default:
          return { sourceId: 'tokenList:<unknown-chain>', sourceKind: 'bundled-fallback', list: [] };
      }
    }

    default:
      return { sourceId: 'fallback:<none>', sourceKind: 'bundled-fallback', list: [] };
  }
}

/** Read JSON either from URL (when provided) or from bundled fallbacks */
async function getDataListObjWithSource(
  feedType: FEED_TYPE,
  chainId?: number,
  seq?: number
): Promise<{ sourceId: string; sourceKind: 'bundled-fallback' | 'remote-url'; list: any[] }> {
  const url = getDataListURL(feedType, chainId);

  // No remote URL => bundled fallback
  if (!url) {
    const fb = getFallbackListWithSource(feedType, chainId);
    debugLog.log?.('[source:selected]', {
      seq,
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      chainId,
      sourceKind: fb.sourceKind,
      selectedSource: fb.sourceId,
      normalizedLen: fb.list.length,
      preview: previewList(fb.list, 5),
      // this helps confirm shape differences immediately:
      raw0: fb.list[0] ? summarize(fb.list[0]) : '(empty)',
    });
    return fb;
  }

  debugLog.log?.('[source:selected]', {
    seq,
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    chainId,
    sourceKind: 'remote-url',
    selectedSource: `remote:${url}`,
    url,
  });

  try {
    const json = await getJson<any>(url, {
      timeoutMs: 8000,
      retries: 1,
      backoffMs: 400,
      accept: 'application/json',
      forceParse: true,
    });

    const normalized = normalizeList(json);

    if (normalized.length) {
      debugLog.log?.('[source:remote][ok]', {
        seq,
        feedType,
        feedTypeLabel: FEED_TYPE[feedType],
        chainId,
        url,
        normalizedLen: normalized.length,
        preview: previewList(normalized, 5),
        raw0: normalized[0] ? summarize(normalized[0]) : '(empty)',
      });
      return { sourceId: `remote:${url}`, sourceKind: 'remote-url', list: normalized };
    }

    const fb = getFallbackListWithSource(feedType, chainId);
    debugLog.warn?.('[source:remote][empty->fallback]', {
      seq,
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      chainId,
      url,
      remoteSummary: summarize(json),
      fallbackSource: fb.sourceId,
      fallbackLen: fb.list.length,
      preview: previewList(fb.list, 5),
    });
    return fb;
  } catch (err) {
    const fb = getFallbackListWithSource(feedType, chainId);
    debugLog.warn?.('[source:remote][error->fallback]', {
      seq,
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      chainId,
      url,
      error: String(err),
      fallbackSource: fb.sourceId,
      fallbackLen: fb.list.length,
      preview: previewList(fb.list, 5),
    });
    return fb;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Management JSON routing
// ──────────────────────────────────────────────────────────────────────────────

function getManageJsonForFeed(feedType: FEED_TYPE): { sourceId: string; sourceKind: 'manage-json'; raw: any } | undefined {
  // NOTE: this intentionally routes SPONSOR_ACCOUNTS to ManageSponsorships sponsors.json.
  // If that’s NOT desired, remove SPONSOR_ACCOUNTS from this switch.
  switch (feedType) {
    case FEED_TYPE.SPONSOR_ACCOUNTS:
      return { sourceId: SOURCES.manage.sponsors, sourceKind: 'manage-json', raw: sponsorsJson };
    case FEED_TYPE.AGENT_ACCOUNTS:
    case FEED_TYPE.MANAGE_AGENTS:
      return { sourceId: SOURCES.manage.agents, sourceKind: 'manage-json', raw: agentsJson };
    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.MANAGE_RECIPIENTS:
      return { sourceId: SOURCES.manage.recipients, sourceKind: 'manage-json', raw: recipientsJson };
    default:
      return undefined;
  }
}

function attachDebugMeta(built: FeedData, meta: { sourceId: string; sourceKind: string; feedType: FEED_TYPE; chainId: number; seq: number }) {
  // Attach in a way that won’t break existing consumers:
  (built as any).__sourceId = meta.sourceId;
  (built as any).__sourceKind = meta.sourceKind;
  (built as any).__feedTypeRequested = meta.feedType;
  (built as any).__chainId = meta.chainId;
  (built as any).__seq = meta.seq;
  return built;
}

function logBuilt(label: string, feedType: FEED_TYPE, built: FeedData, source: SelectedSource, seq: number, chainId: number) {
  const walletsLen = Array.isArray((built as any).wallets) ? (built as any).wallets.length : 0;
  const tokensLen = Array.isArray((built as any).tokens) ? (built as any).tokens.length : 0;

  debugLog.log?.(`[${label}]`, {
    seq,
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    chainId,
    sourceKind: source.sourceKind,
    selectedSource: source.sourceId,
    walletsLen,
    tokensLen,
    sampleWalletAddresses: Array.isArray((built as any).wallets)
      ? (built as any).wallets
          .slice(0, 8)
          .map((w: any) => String(w?.address ?? ''))
          .filter(Boolean)
      : [],
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Fetch raw list/spec (URL or fallback) and normalize via builders → FeedData
 *
 * ✅ This function now logs EXACTLY which JSON module was selected BEFORE any account expansion occurs.
 * ✅ It also tags the returned FeedData with:
 *    - __sourceId, __sourceKind, __feedTypeRequested, __chainId, __seq
 */
export async function fetchAndBuildDataList(feedType: FEED_TYPE, chainId: number): Promise<FeedData> {
  const seq = ++CALL_SEQ;

  debugLog.log?.('[start]', {
    seq,
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    chainId,
  });

  // 1) Management JSON routing (if applicable)
  const manage = getManageJsonForFeed(feedType);

  if (manage) {
    debugLog.log?.('[source:selected]', {
      seq,
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      chainId,
      sourceKind: manage.sourceKind,
      selectedSource: manage.sourceId,
      rawSummary: summarize(manage.raw),
      // IMPORTANT: show actual content shape
      normalizedLen: normalizeList(manage.raw).length,
      preview: previewList(normalizeList(manage.raw), 5),
    });

    // IMPORTANT: build using the REAL feedType (no coercion)
    const built = (await feedDataFromJson(feedType as any, chainId, manage.raw as any)) as any as FeedData;

    attachDebugMeta(built, {
      sourceId: manage.sourceId,
      sourceKind: manage.sourceKind,
      feedType,
      chainId,
      seq,
    });

    logBuilt('built(manage)', feedType, built, { sourceId: manage.sourceId, sourceKind: manage.sourceKind }, seq, chainId);
    return built;
  }

  // 2) Default path: URL/fallback-driven spec
  const { sourceId, sourceKind, list: jsonSpec } = await getDataListObjWithSource(feedType, chainId, seq);

  debugLog.log?.('[spec:ready]', {
    seq,
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    chainId,
    sourceKind,
    selectedSource: sourceId,
    jsonSpecLen: Array.isArray(jsonSpec) ? jsonSpec.length : -1,
    preview: Array.isArray(jsonSpec) ? previewList(jsonSpec, 8) : undefined,
    raw0: Array.isArray(jsonSpec) && jsonSpec[0] ? summarize(jsonSpec[0]) : '(empty)',
  });

  const built = (await feedDataFromJson(feedType as any, chainId, jsonSpec as any)) as any as FeedData;

  attachDebugMeta(built, {
    sourceId,
    sourceKind,
    feedType,
    chainId,
    seq,
  });

  logBuilt('built(default)', feedType, built, { sourceId, sourceKind }, seq, chainId);
  return built;
}

/**
 * Convenience: get a source and return a single normalized item.
 * - TOKEN_LIST → one BuiltToken (from first/only item)
 * - *_ACCOUNTS → first spCoinAccount (or null if none)
 */
export async function fetchSingleFromSource(feedType: FEED_TYPE, chainId: number) {
  const seq = ++CALL_SEQ;

  debugLog.log?.('[single:start]', {
    seq,
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    chainId,
  });

  const manage = getManageJsonForFeed(feedType);

  if (manage) {
    debugLog.log?.('[single][source:selected]', {
      seq,
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      chainId,
      sourceKind: manage.sourceKind,
      selectedSource: manage.sourceId,
      rawSummary: summarize(manage.raw),
      normalizedLen: normalizeList(manage.raw).length,
      preview: previewList(normalizeList(manage.raw), 5),
    });

    const first = await buildWalletFromJsonFirst(manage.raw as any);
    debugLog.log?.('[single(manage)][result]', {
      seq,
      feedTypeLabel: FEED_TYPE[feedType],
      hasWallet: !!first,
      addr: (first as any)?.address ?? '(none)',
    });
    return first;
  }

  const { sourceId, sourceKind, list: jsonSpec } = await getDataListObjWithSource(feedType, chainId, seq);

  debugLog.log?.('[single][source:selected][spec]', {
    seq,
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    chainId,
    sourceKind,
    selectedSource: sourceId,
    jsonSpecLen: Array.isArray(jsonSpec) ? jsonSpec.length : -1,
    preview: Array.isArray(jsonSpec) ? previewList(jsonSpec, 5) : undefined,
  });

  switch (feedType) {
    case FEED_TYPE.TOKEN_LIST: {
      const arr = Array.isArray(jsonSpec) ? jsonSpec : jsonSpec ? [jsonSpec] : [];
      const first = arr[0] ?? null;
      return first ? buildTokenFromJson(first, chainId) : null;
    }

    case FEED_TYPE.RECIPIENT_ACCOUNTS:
    case FEED_TYPE.AGENT_ACCOUNTS:
    case FEED_TYPE.SPONSOR_ACCOUNTS:
    case FEED_TYPE.MANAGE_RECIPIENTS:
    case FEED_TYPE.MANAGE_AGENTS: {
      const first = await buildWalletFromJsonFirst(jsonSpec);
      debugLog.log?.('[single(default)][result]', {
        seq,
        feedTypeLabel: FEED_TYPE[feedType],
        hasWallet: !!first,
        addr: (first as any)?.address ?? '(none)',
      });
      return first;
    }

    default:
      return null;
  }
}
