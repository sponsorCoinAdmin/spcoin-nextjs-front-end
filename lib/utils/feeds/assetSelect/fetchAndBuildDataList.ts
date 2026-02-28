// File: @/lib/utils/feeds/assetSelect/fetchAndBuildDataList.ts
'use client';

import { FEED_TYPE, type FeedData } from '@/lib/structure';
import { loadTokenSeedAddresses } from '@/lib/context/tokens/tokenStore';

// ✅ Now from accountHydration (SSOT) — builders deleted.
import { feedDataFromJson, buildTokenFromJson, buildWalletFromJsonFirst } from '@/lib/context/helpers/accountHydration';

// ✅ Bundled account feeds
import recipientsAccountsJson from '@/resources/data/mockFeeds/accounts/recipients/accounts.json';
import agentsAccountsJson from '@/resources/data/mockFeeds/accounts/agents/accounts.json';
import sponsorsAccountsJson from '@/resources/data/mockFeeds/accounts/sponsors/accounts.json';

// ✅ Bundled fallbacks
import baseTokenListRaw from '@/resources/data/networks/base/tokenList.json';
import hardhatTokenListRaw from '@/resources/data/networks/hardhat/tokenList.json';
import polygonTokenListRaw from '@/resources/data/networks/polygon/tokenList.json';
import sepoliaTokenListRaw from '@/resources/data/networks/sepolia/tokenList.json';
import ethereumTokenListRaw from '@/resources/data/networks/ethereum/tokenList.json';

import { CHAIN_ID } from '@/lib/structure/enums/networkIds';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false as const;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true';

const debugLog = createDebugLogger('fetchAndBuildDataList', DEBUG_ENABLED, LOG_TIME);

let CALL_SEQ = 0;

// legacy key constant (keeps dot-access out of the file)
const LEGACY_WALLETS_KEY = 'wallets' as const;

const SOURCES = {
  accounts: {
    recipients: '@/resources/data/mockFeeds/accounts/recipients/accounts.json',
    agents: '@/resources/data/mockFeeds/accounts/agents/accounts.json',
    sponsors: '@/resources/data/mockFeeds/accounts/sponsors/accounts.json',
  },
  manage: {
    recipients: '@/resources/data/mockFeeds/accounts/recipients/recipients.json',
    agents: '@/resources/data/mockFeeds/accounts/agents/agents.json',
    sponsors: '@/resources/data/mockFeeds/accounts/sponsors/sponsors.json',
  },
  tokenLists: {
    ethereum: '@/resources/data/networks/ethereum/tokenList.json',
    base: '@/resources/data/networks/base/tokenList.json',
    polygon: '@/resources/data/networks/polygon/tokenList.json',
    hardhat: '@/resources/data/networks/hardhat/tokenList.json',
    sepolia: '@/resources/data/networks/sepolia/tokenList.json',
  },
} as const;

const ACCOUNT_FEED_SOURCES = {
  [FEED_TYPE.RECIPIENT_ACCOUNTS]: {
    sourceId: SOURCES.accounts.recipients,
    raw: recipientsAccountsJson as any,
  },
  [FEED_TYPE.AGENT_ACCOUNTS]: {
    sourceId: SOURCES.accounts.agents,
    raw: agentsAccountsJson as any,
  },
  [FEED_TYPE.SPONSOR_ACCOUNTS]: {
    sourceId: SOURCES.accounts.sponsors,
    raw: sponsorsAccountsJson as any,
  },
} as const;

// Manage feeds currently reuse account feeds as placeholder data until dedicated sources are wired.
const MANAGE_FEED_SOURCES = {
  [FEED_TYPE.MANAGE_RECIPIENTS]: {
    sourceId: SOURCES.manage.recipients,
    raw: recipientsAccountsJson as any,
  },
  [FEED_TYPE.MANAGE_AGENTS]: {
    sourceId: SOURCES.manage.agents,
    raw: agentsAccountsJson as any,
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

function normalizeList(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    // legacy inputs (INPUT ONLY) — avoid dot access
    if (Array.isArray((raw as any)[LEGACY_WALLETS_KEY])) return (raw as any)[LEGACY_WALLETS_KEY];

    // common wrappers
    if (Array.isArray((raw as any).items)) return (raw as any).items;
    if (Array.isArray((raw as any).accounts)) return (raw as any).accounts;
    if (Array.isArray((raw as any).recipients)) return (raw as any).recipients;
    if (Array.isArray((raw as any).agents)) return (raw as any).agents;
    if (Array.isArray((raw as any).sponsors)) return (raw as any).sponsors;
  }
  return [];
}

function summarize(raw: any) {
  if (Array.isArray(raw)) return { kind: 'array', length: raw.length };
  if (raw && typeof raw === 'object') return { kind: 'object', keys: Object.keys(raw).slice(0, 25) };
  return { kind: String(raw) };
}

function previewList(list: any[], max = 5) {
  const slice = list.slice(0, max);
  return slice.map((x) => {
    if (!x || typeof x !== 'object') return x;
    const obj: any = x;

    return {
      address: obj.address ?? obj.addr ?? obj[LEGACY_WALLETS_KEY] ?? obj.id,
      file: obj.file,
      url: obj.url,
      name: obj.name,
      symbol: obj.symbol,
      inline: Array.isArray(obj.inline) ? `inline[${obj.inline.length}]` : undefined,
      accounts: Array.isArray(obj.accounts) ? `accounts[${obj.accounts.length}]` : undefined,
    };
  });
}

function getFallbackListWithSource(
  feedType: FEED_TYPE,
  chainId?: number,
): { sourceId: string; sourceKind: 'bundled-fallback'; list: any[] } {
  const accountSource = ACCOUNT_FEED_SOURCES[feedType as keyof typeof ACCOUNT_FEED_SOURCES];
  if (accountSource) {
    const list = normalizeList(accountSource.raw);
    return { sourceId: accountSource.sourceId, sourceKind: 'bundled-fallback', list };
  }

  switch (feedType) {
    case FEED_TYPE.TOKEN_LIST: {
      switch (Number(chainId)) {
        case CHAIN_ID.ETHEREUM:
          return { sourceId: SOURCES.tokenLists.ethereum, sourceKind: 'bundled-fallback', list: ethereumTokenList as any[] };
        case CHAIN_ID.BASE:
          return { sourceId: SOURCES.tokenLists.base, sourceKind: 'bundled-fallback', list: baseTokenList as any[] };
        case CHAIN_ID.POLYGON:
          return { sourceId: SOURCES.tokenLists.polygon, sourceKind: 'bundled-fallback', list: polygonTokenList as any[] };
        case CHAIN_ID.HARDHAT_BASE:
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

async function getDataListObjWithSource(
  feedType: FEED_TYPE,
  chainId?: number,
  seq?: number,
): Promise<{ sourceId: string; sourceKind: 'bundled-fallback' | 'remote-url'; list: any[] }> {
  if (feedType !== FEED_TYPE.TOKEN_LIST) {
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
      raw0: fb.list[0] ? summarize(fb.list[0]) : '(empty)',
    });
    return fb;
  }

  const parsedChainId = Number(chainId);
  if (!Number.isFinite(parsedChainId) || parsedChainId <= 0) {
    const fb = getFallbackListWithSource(feedType, chainId);
    return fb;
  }

  const url = `/api/spCoin/tokens?chainId=${parsedChainId}`;

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
    const normalized = await loadTokenSeedAddresses(parsedChainId);

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
      remoteSummary: { kind: 'array', length: 0 },
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
  const manageSource = MANAGE_FEED_SOURCES[feedType as keyof typeof MANAGE_FEED_SOURCES];
  if (!manageSource) return undefined;
  return { sourceId: manageSource.sourceId, sourceKind: 'manage-json', raw: manageSource.raw };
}

/**
 * ✅ HARD RULE: output uses SSOT `spCoinAccounts` for account feeds.
 * If anything ever returns legacy wallets array, migrate it once and delete it.
 */
function enforceAccountsOnly(built: any): FeedData {
  const b: any = built ?? {};

  const legacy = b[LEGACY_WALLETS_KEY];
  if (Array.isArray(legacy) && !Array.isArray(b.spCoinAccounts)) {
    b.spCoinAccounts = legacy;
  }

  if (LEGACY_WALLETS_KEY in b) delete b[LEGACY_WALLETS_KEY];

  return b as FeedData;
}

function attachDebugMeta(
  built: FeedData,
  meta: { sourceId: string; sourceKind: string; feedType: FEED_TYPE; chainId: number; seq: number },
) {
  (built as any).__sourceId = meta.sourceId;
  (built as any).__sourceKind = meta.sourceKind;
  (built as any).__feedTypeRequested = meta.feedType;
  (built as any).__chainId = meta.chainId;
  (built as any).__seq = meta.seq;
  return built;
}

function logBuilt(label: string, feedType: FEED_TYPE, built: FeedData, source: SelectedSource, seq: number, chainId: number) {
  const accountsLen = Array.isArray((built as any).spCoinAccounts) ? (built as any).spCoinAccounts.length : 0;
  const tokensLen = Array.isArray((built as any).tokens) ? (built as any).tokens.length : 0;

  debugLog.log?.(`[${label}]`, {
    seq,
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    chainId,
    sourceKind: source.sourceKind,
    selectedSource: source.sourceId,
    accountsLen,
    tokensLen,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

export async function fetchAndBuildDataList(feedType: FEED_TYPE, chainId: number): Promise<FeedData> {
  const seq = ++CALL_SEQ;

  debugLog.log?.('[start]', { seq, feedType, feedTypeLabel: FEED_TYPE[feedType], chainId });

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
      normalizedLen: normalizeList(manage.raw).length,
      preview: previewList(normalizeList(manage.raw), 5),
    });

    const rawBuilt = (await feedDataFromJson(feedType as any, chainId, manage.raw as any)) as any;
    const built = enforceAccountsOnly(rawBuilt);

    attachDebugMeta(built, { sourceId: manage.sourceId, sourceKind: manage.sourceKind, feedType, chainId, seq });
    logBuilt('built(manage)', feedType, built, { sourceId: manage.sourceId, sourceKind: manage.sourceKind }, seq, chainId);

    return built;
  }

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
  });

  const rawBuilt = (await feedDataFromJson(feedType as any, chainId, jsonSpec as any)) as any;
  const built = enforceAccountsOnly(rawBuilt);

  attachDebugMeta(built, { sourceId, sourceKind, feedType, chainId, seq });
  logBuilt('built(default)', feedType, built, { sourceId, sourceKind }, seq, chainId);

  return built;
}

export async function fetchSingleFromSource(feedType: FEED_TYPE, chainId: number) {
  const seq = ++CALL_SEQ;

  debugLog.log?.('[single:start]', { seq, feedType, feedTypeLabel: FEED_TYPE[feedType], chainId });

  const manage = getManageJsonForFeed(feedType);

  if (manage) {
    // legacy name, but the returned object is the account type
    const first = await buildWalletFromJsonFirst(manage.raw as any);
    return first;
  }

  const { list: jsonSpec } = await getDataListObjWithSource(feedType, chainId, seq);

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
      return first;
    }

    default:
      return null;
  }
}
