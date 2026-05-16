import type { SpCoinReadCacheOptions } from "./readCache";

const METHOD_READ_CACHE_TTL_MS: Record<string, number> = {
  getAccountRecord: 60 * 60 * 1000,
  getAccountRecordShallow: 60 * 60 * 1000,
};

const METHOD_READ_CACHE_TTL_BLOCKS: Record<string, string> = {
  estimateOffChainTotalRewards: "ESTIMATE_REWARDS",
  estimateOffChainSponsorRewards: "ESTIMATE_REWARDS",
  estimateOffChainRecipientRewards: "ESTIMATE_REWARDS",
  estimateOffChainAgentRewards: "ESTIMATE_REWARDS",
  getInflationRate: "INFLATION",
  getAccountStakingRewards: "INITIAL_STAKING_REWARDS",
  getAgentRateKeys: "RATES",
  getAgentRateList: "RATES",
  getAgentRateRange: "RATES",
  getRecipientRateAgentKeys: "RATES",
  getRecipientRateAgentList: "RATES",
  getRecipientRateKeys: "RATES",
  getRecipientRateList: "RATES",
  getSponsorRecipientRates: "RATES",
  getSponsorRecipientRateKeys: "RATES",
  getRateTransactionSet: "RATES",
  getRecipientRateTransactionSetKey: "RATES",
  getAgentRateTransactionSetKey: "RATES",
  isDeployed: "ACCOUNT_EXISTENCE",
  isAccountInserted: "ACCOUNT_EXISTENCE",
};

const BLOCK_READ_CACHE_TTL_ENV_VALUES: Record<string, string | undefined> = {
  ESTIMATE_REWARDS: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_BLOCK_ESTIMATE_REWARDS,
  INFLATION: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_BLOCK_INFLATION,
  RATES: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_BLOCK_RATES,
  INITIAL_STAKING_REWARDS: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_BLOCK_INITIAL_STAKING_REWARDS,
  ACCOUNT_EXISTENCE: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_BLOCK_ACCOUNT_EXISTENCE,
};

const METHOD_READ_CACHE_TTL_ENV_VALUES: Record<string, string | undefined> = {
  getMasterAccountMetaData: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_MASTER_ACCOUNT_META_DATA,
  getAccountKeys: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_KEYS,
  getMasterAccountKeys: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_MASTER_ACCOUNT_KEYS,
  getMasterAccountList: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_MASTER_ACCOUNT_LIST,
  getAccountListSize: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_LIST_SIZE,
  getAccountKeyCount: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_KEY_COUNT,
  getMasterAccountKeyCount: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_MASTER_ACCOUNT_KEY_COUNT,
  getMasterAccountCount: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_MASTER_ACCOUNT_COUNT,
  getMasterAccountListSize: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_MASTER_ACCOUNT_LIST_SIZE,
  getActiveAccountKeys: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACTIVE_ACCOUNT_KEYS,
  getActiveAccountList: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACTIVE_ACCOUNT_LIST,
  getActiveAccountCount: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACTIVE_ACCOUNT_COUNT,
  getActiveAccountListSize: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACTIVE_ACCOUNT_LIST_SIZE,
  getActiveAccountKeyAt: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACTIVE_ACCOUNT_KEY_AT,
  getActiveAccountElement: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACTIVE_ACCOUNT_ELEMENT,
  getSponsorKeys: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_SPONSOR_KEYS,
  getRecipientKeys: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_KEYS,
  getAccountRecipientList: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_RECIPIENT_LIST,
  getAccountRecipientListSize: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_RECIPIENT_LIST_SIZE,
  getAccountRecord: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_RECORD,
  getAccountRecordShallow: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_RECORD_SHALLOW,
  getAccountRoleSummary: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_ROLE_SUMMARY,
  getAccountRoles: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_ROLES,
  isSponsor: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_IS_SPONSOR,
  isRecipient: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_IS_RECIPIENT,
  isAgent: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_IS_AGENT,
  getAccountStakingRewards: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_STAKING_REWARDS,
  estimateOffChainTotalRewards: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_ESTIMATE_OFF_CHAIN_TOTAL_REWARDS,
  estimateOffChainSponsorRewards: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_ESTIMATE_OFF_CHAIN_SPONSOR_REWARDS,
  estimateOffChainRecipientRewards: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_ESTIMATE_OFF_CHAIN_RECIPIENT_REWARDS,
  estimateOffChainAgentRewards: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_ESTIMATE_OFF_CHAIN_AGENT_REWARDS,
  getTransactionRecord: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_TRANSACTION_RECORD,
  getAccountLinks: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_LINKS,
  getRecipientTransactionIdKeys: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_TRANSACTION_ID_KEYS,
  getAgentTransactionIdKeys: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_AGENT_TRANSACTION_ID_KEYS,
  getSpCoinMetaData: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_SP_COIN_META_DATA,
  getInflationRate: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_INFLATION_RATE,
  getAgentRateKeys: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_AGENT_RATE_KEYS,
  getAgentRateList: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_AGENT_RATE_LIST,
  getAgentRateRange: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_AGENT_RATE_RANGE,
  getAgentTransaction: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_AGENT_TRANSACTION,
  getAgentTransactionList: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_AGENT_TRANSACTION_LIST,
  getAgent: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_AGENT,
  getAgentRecordList: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_AGENT_RECORD_LIST,
  getAgentTransactionEntries: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_AGENT_TRANSACTION_ENTRIES,
  getRecipientRateAgentKeys: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_RATE_AGENT_KEYS,
  getRecipientRateAgentList: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_RATE_AGENT_LIST,
  getRecipientRateRange: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_RATE_RANGE,
  getRecipientTransaction: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_TRANSACTION,
  getRecipientTransactionList: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_TRANSACTION_LIST,
  getRecipient: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT,
  getRecipientRecordList: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_RECORD_LIST,
  getRecipientRateKeys: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_RATE_KEYS,
  getRecipientRateList: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_RATE_LIST,
  getSponsorRecipientRates: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_SPONSOR_RECIPIENT_RATES,
  getSponsorRecipientRateKeys: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_SPONSOR_RECIPIENT_RATE_KEYS,
  getRecipientTransactionEntries: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_TRANSACTION_ENTRIES,
  getRateTransactionSet: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RATE_TRANSACTION_SET,
  getRecipientRateTransactionSetKey: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_RECIPIENT_RATE_TRANSACTION_SET_KEY,
  getAgentRateTransactionSetKey: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_AGENT_RATE_TRANSACTION_SET_KEY,
  getAccountRecordBase: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_GET_ACCOUNT_RECORD_BASE,
  isDeployed: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_IS_DEPLOYED,
  isAccountInserted: process.env.NEXT_PUBLIC_SPCOIN_READ_CACHE_TTL_MS_IS_ACCOUNT_INSERTED,
};

function parseMethodTtlMs(value: unknown): number | null | undefined {
  const raw = String(value ?? "").replace(/,/g, "").trim();
  if (!raw) return undefined;
  if (raw === "-1") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getMethodEnvTtlMs(methodName: string): number | null | undefined {
  return parseMethodTtlMs(METHOD_READ_CACHE_TTL_ENV_VALUES[methodName]);
}

function getBlockEnvTtlMs(methodName: string): number | null | undefined {
  const blockName = METHOD_READ_CACHE_TTL_BLOCKS[methodName];
  if (!blockName) return undefined;
  return parseMethodTtlMs(BLOCK_READ_CACHE_TTL_ENV_VALUES[blockName]);
}

export function applyMethodCacheDefaults(methodName: string, options: SpCoinReadCacheOptions): SpCoinReadCacheOptions {
  if (options.ttlMs != null || options.blockTag != null || options.timestampOverride != null) return options;
  const envTtlMs = getMethodEnvTtlMs(methodName);
  if (envTtlMs !== undefined) {
    if (envTtlMs !== null) {
      return {
        ...options,
        ttlMs: envTtlMs,
      };
    }
    const blockTtlMs = getBlockEnvTtlMs(methodName);
    if (blockTtlMs === null) return options;
    if (blockTtlMs !== undefined) {
      return {
        ...options,
        ttlMs: blockTtlMs,
      };
    }
    return options;
  }
  const methodTtlMs = METHOD_READ_CACHE_TTL_MS[methodName];
  if (methodTtlMs != null) {
    return {
      ...options,
      ttlMs: methodTtlMs,
    };
  }
  const blockTtlMs = getBlockEnvTtlMs(methodName);
  if (blockTtlMs === null || blockTtlMs === undefined) return options;
  return { ...options, ttlMs: blockTtlMs };
}
