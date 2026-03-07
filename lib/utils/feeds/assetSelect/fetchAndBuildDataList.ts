// File: @/lib/utils/feeds/assetSelect/fetchAndBuildDataList.ts
'use client';

import { FEED_TYPE, type FeedData } from '@/lib/structure';
import { loadTokenSeedAddresses } from '@/lib/context/tokens/tokenStore';
import { buildTokenFromJson } from '@/lib/tokens/tokenHydration';
import {
  feedDataFromJson,
  buildWalletFromJsonFirst,
} from '@/lib/context/helpers/accountHydration';

import recipientsAccountsJson from '@/resources/data/mockFeeds/accounts/recipients/accounts.json';
import agentsAccountsJson from '@/resources/data/mockFeeds/accounts/agents/accounts.json';
import sponsorsAccountsJson from '@/resources/data/mockFeeds/accounts/sponsors/accounts.json';

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

const debugLog = createDebugLogger(
  'fetchAndBuildDataList',
  DEBUG_ENABLED,
  LOG_TIME,
);

let CALL_SEQ = 0;
const LEGACY_WALLETS_KEY = 'wallets' as const;

type SourceKind = 'manage-json' | 'bundled-fallback' | 'remote-url';

interface SelectedSource {
  sourceId: string;
  sourceKind: SourceKind;
}

interface DebugMeta {
  __sourceId?: string;
  __sourceKind?: string;
  __feedTypeRequested?: FEED_TYPE;
  __chainId?: number;
  __seq?: number;
}

type FeedDataWithMeta = FeedData & DebugMeta;
type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === 'object' ? (value as UnknownRecord) : undefined;
}

function getArrayProp(record: UnknownRecord, key: string): unknown[] | undefined {
  const value = record[key];
  return Array.isArray(value) ? value : undefined;
}

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
    raw: recipientsAccountsJson as unknown,
  },
  [FEED_TYPE.AGENT_ACCOUNTS]: {
    sourceId: SOURCES.accounts.agents,
    raw: agentsAccountsJson as unknown,
  },
  [FEED_TYPE.SPONSOR_ACCOUNTS]: {
    sourceId: SOURCES.accounts.sponsors,
    raw: sponsorsAccountsJson as unknown,
  },
} as const;

const MANAGE_FEED_SOURCES = {
  [FEED_TYPE.MANAGE_RECIPIENTS]: {
    sourceId: SOURCES.manage.recipients,
    raw: recipientsAccountsJson as unknown,
  },
  [FEED_TYPE.MANAGE_AGENTS]: {
    sourceId: SOURCES.manage.agents,
    raw: agentsAccountsJson as unknown,
  },
} as const;

const baseTokenList = baseTokenListRaw as unknown[];
const hardhatTokenList = hardhatTokenListRaw as unknown[];
const polygonTokenList = polygonTokenListRaw as unknown[];
const sepoliaTokenList = sepoliaTokenListRaw as unknown[];
const ethereumTokenList = ethereumTokenListRaw as unknown[];

function normalizeList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const record = asRecord(raw);
  if (!record) return [];

  const legacyWallets = getArrayProp(record, LEGACY_WALLETS_KEY);
  if (legacyWallets) return legacyWallets;

  return (
    getArrayProp(record, 'items') ??
    getArrayProp(record, 'accounts') ??
    getArrayProp(record, 'recipients') ??
    getArrayProp(record, 'agents') ??
    getArrayProp(record, 'sponsors') ??
    []
  );
}

function summarize(raw: unknown) {
  if (Array.isArray(raw)) return { kind: 'array', length: raw.length };
  if (raw && typeof raw === 'object') {
    return { kind: 'object', keys: Object.keys(raw).slice(0, 25) };
  }
  return { kind: String(raw) };
}

function previewList(list: unknown[], max = 5) {
  return list.slice(0, max).map((entry) => {
    const obj = asRecord(entry);
    if (!obj) return entry;

    return {
      address: obj.address ?? obj.addr ?? obj[LEGACY_WALLETS_KEY],
      file: obj.file,
      url: obj.url,
      name: obj.name,
      symbol: obj.symbol,
      inline: Array.isArray(obj.inline) ? `inline[${obj.inline.length}]` : undefined,
      accounts: Array.isArray(obj.accounts)
        ? `accounts[${obj.accounts.length}]`
        : undefined,
    };
  });
}

function getFallbackListWithSource(
  feedType: FEED_TYPE,
  chainId?: number,
): { sourceId: string; sourceKind: 'bundled-fallback'; list: unknown[] } {
  const accountSource =
    ACCOUNT_FEED_SOURCES[feedType as keyof typeof ACCOUNT_FEED_SOURCES];
  if (accountSource) {
    return {
      sourceId: accountSource.sourceId,
      sourceKind: 'bundled-fallback',
      list: normalizeList(accountSource.raw),
    };
  }

  if (feedType !== FEED_TYPE.TOKEN_LIST) {
    return {
      sourceId: 'fallback:<none>',
      sourceKind: 'bundled-fallback',
      list: [],
    };
  }

  switch (Number(chainId)) {
    case CHAIN_ID.ETHEREUM:
      return { sourceId: SOURCES.tokenLists.ethereum, sourceKind: 'bundled-fallback', list: ethereumTokenList };
    case CHAIN_ID.BASE:
      return { sourceId: SOURCES.tokenLists.base, sourceKind: 'bundled-fallback', list: baseTokenList };
    case CHAIN_ID.POLYGON:
      return { sourceId: SOURCES.tokenLists.polygon, sourceKind: 'bundled-fallback', list: polygonTokenList };
    case CHAIN_ID.HARDHAT_BASE:
      return { sourceId: SOURCES.tokenLists.hardhat, sourceKind: 'bundled-fallback', list: hardhatTokenList };
    case CHAIN_ID.SEPOLIA:
      return { sourceId: SOURCES.tokenLists.sepolia, sourceKind: 'bundled-fallback', list: sepoliaTokenList };
    default:
      return { sourceId: 'tokenList:<unknown-chain>', sourceKind: 'bundled-fallback', list: [] };
  }
}

async function getDataListObjWithSource(
  feedType: FEED_TYPE,
  chainId?: number,
  seq?: number,
): Promise<{ sourceId: string; sourceKind: 'bundled-fallback' | 'remote-url'; list: unknown[] }> {
  if (feedType !== FEED_TYPE.TOKEN_LIST) {
    const fallback = getFallbackListWithSource(feedType, chainId);
    debugLog.log?.('[source:selected]', {
      seq,
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      chainId,
      sourceKind: fallback.sourceKind,
      selectedSource: fallback.sourceId,
      normalizedLen: fallback.list.length,
      preview: previewList(fallback.list, 5),
      raw0: fallback.list[0] ? summarize(fallback.list[0]) : '(empty)',
    });
    return fallback;
  }

  const parsedChainId = Number(chainId);
  if (!Number.isFinite(parsedChainId) || parsedChainId <= 0) {
    return getFallbackListWithSource(feedType, chainId);
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
    if (normalized.length > 0) {
      debugLog.log?.('[source:remote][ok]', {
        seq,
        feedType,
        feedTypeLabel: FEED_TYPE[feedType],
        chainId,
        url,
        normalizedLen: normalized.length,
        preview: previewList(normalized, 5),
      });
      return { sourceId: `remote:${url}`, sourceKind: 'remote-url', list: normalized };
    }

    const fallback = getFallbackListWithSource(feedType, chainId);
    debugLog.warn?.('[source:remote][empty->fallback]', {
      seq,
      feedType,
      chainId,
      url,
      fallbackSource: fallback.sourceId,
      fallbackLen: fallback.list.length,
    });
    return fallback;
  } catch (err) {
    const fallback = getFallbackListWithSource(feedType, chainId);
    debugLog.warn?.('[source:remote][error->fallback]', {
      seq,
      feedType,
      chainId,
      url,
      error: String(err),
      fallbackSource: fallback.sourceId,
      fallbackLen: fallback.list.length,
    });
    return fallback;
  }
}

function getManageJsonForFeed(
  feedType: FEED_TYPE,
): { sourceId: string; sourceKind: 'manage-json'; raw: unknown } | undefined {
  const manageSource =
    MANAGE_FEED_SOURCES[feedType as keyof typeof MANAGE_FEED_SOURCES];
  if (!manageSource) return undefined;
  return {
    sourceId: manageSource.sourceId,
    sourceKind: 'manage-json',
    raw: manageSource.raw,
  };
}

function enforceAccountsOnly(built: unknown): FeedData {
  const data = (asRecord(built) ?? {}) as FeedDataWithMeta & {
    spCoinAccounts?: unknown;
    wallets?: unknown;
  };

  if (Array.isArray(data.wallets) && !Array.isArray(data.spCoinAccounts)) {
    data.spCoinAccounts = data.wallets;
  }
  delete data.wallets;

  return data as FeedData;
}

function attachDebugMeta(
  built: FeedDataWithMeta,
  meta: {
    sourceId: string;
    sourceKind: string;
    feedType: FEED_TYPE;
    chainId: number;
    seq: number;
  },
): FeedDataWithMeta {
  built.__sourceId = meta.sourceId;
  built.__sourceKind = meta.sourceKind;
  built.__feedTypeRequested = meta.feedType;
  built.__chainId = meta.chainId;
  built.__seq = meta.seq;
  return built;
}

function logBuilt(
  label: string,
  feedType: FEED_TYPE,
  built: FeedData,
  source: SelectedSource,
  seq: number,
  chainId: number,
) {
  const data = built as FeedDataWithMeta & {
    spCoinAccounts?: unknown;
    tokens?: unknown;
  };
  const accountsLen = Array.isArray(data.spCoinAccounts)
    ? data.spCoinAccounts.length
    : 0;
  const tokensLen = Array.isArray(data.tokens) ? data.tokens.length : 0;

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

export async function fetchAndBuildDataList(
  feedType: FEED_TYPE,
  chainId: number,
): Promise<FeedData> {
  const seq = ++CALL_SEQ;
  debugLog.log?.('[start]', {
    seq,
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    chainId,
  });

  const manage = getManageJsonForFeed(feedType);
  if (manage) {
    const rawBuilt = await feedDataFromJson(feedType, chainId, manage.raw);
    const built = enforceAccountsOnly(rawBuilt);
    attachDebugMeta(built as FeedDataWithMeta, {
      sourceId: manage.sourceId,
      sourceKind: manage.sourceKind,
      feedType,
      chainId,
      seq,
    });
    logBuilt(
      'built(manage)',
      feedType,
      built,
      { sourceId: manage.sourceId, sourceKind: manage.sourceKind },
      seq,
      chainId,
    );
    return built;
  }

  const { sourceId, sourceKind, list: jsonSpec } = await getDataListObjWithSource(
    feedType,
    chainId,
    seq,
  );

  const rawBuilt = await feedDataFromJson(feedType, chainId, jsonSpec);
  const built = enforceAccountsOnly(rawBuilt);
  attachDebugMeta(built as FeedDataWithMeta, {
    sourceId,
    sourceKind,
    feedType,
    chainId,
    seq,
  });
  logBuilt('built(default)', feedType, built, { sourceId, sourceKind }, seq, chainId);

  return built;
}

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
    return await buildWalletFromJsonFirst(manage.raw);
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
    case FEED_TYPE.MANAGE_AGENTS:
      return await buildWalletFromJsonFirst(jsonSpec);
    default:
      return null;
  }
}
