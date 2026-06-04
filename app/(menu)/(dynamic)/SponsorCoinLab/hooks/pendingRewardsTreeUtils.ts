import { normalizePendingRewardsDisplayResult } from '@/lib/spCoinLab/pendingRewards';
import {
  resolveSpCoinAccountRoleLabel,
  resolveSpCoinAccountRoles,
  resolveSpCoinMethodRole,
} from '@/lib/spCoinLab/accountRoles';

function toDisplayString(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
}

export type PendingRewardsMethodName =
  | 'estimateOffChainTotalRewards'
  | 'estimateOffChainSponsorRewards'
  | 'estimateOffChainRecipientRewards'
  | 'estimateOffChainAgentRewards'
  | 'claimOnChainTotalRewards'
  | 'claimOnChainSponsorRewards'
  | 'claimOnChainRecipientRewards'
  | 'claimOnChainAgentRewards';

export type PendingRewardsActionClick = {
  accountKey: string;
  action: 'claim' | 'estimate';
  method?: PendingRewardsMethodName;
  methods?: PendingRewardsMethodName[];
};

export const PENDING_REWARDS_ESTIMATE_METHODS = new Set([
  'estimateOffChainTotalRewards',
  'estimateOffChainSponsorRewards',
  'estimateOffChainRecipientRewards',
  'estimateOffChainAgentRewards',
]);

export const PENDING_REWARDS_CLAIM_METHODS = new Set([
  'claimOnChainTotalRewards',
  'claimOnChainSponsorRewards',
  'claimOnChainRecipientRewards',
  'claimOnChainAgentRewards',
]);

function isPendingRewardsMethodName(value: string): value is PendingRewardsMethodName {
  return PENDING_REWARDS_ESTIMATE_METHODS.has(value) || PENDING_REWARDS_CLAIM_METHODS.has(value);
}

const PENDING_REWARDS_METHOD_KEYS = [
  'estimateOffChainTotalRewards',
  'claimOnChainTotalRewards',
  'estimateOffChainSponsorRewards',
  'claimOnChainSponsorRewards',
  'estimateOffChainRecipientRewards',
  'claimOnChainRecipientRewards',
  'estimateOffChainAgentRewards',
  'claimOnChainAgentRewards',
] as const;

type PendingRewardsRoleName = 'Sponsor' | 'Recipient' | 'Agent';

type PendingRewardsRoleState = {
  known: boolean;
  role: string;
  roles: PendingRewardsRoleName[];
  isSponsor: boolean;
  isRecipient: boolean;
  isAgent: boolean;
};

const PENDING_REWARDS_METHOD_ROLE: Record<string, PendingRewardsRoleName> = {
  estimateOffChainSponsorRewards: 'Sponsor',
  claimOnChainSponsorRewards: 'Sponsor',
  estimateOffChainRecipientRewards: 'Recipient',
  claimOnChainRecipientRewards: 'Recipient',
  estimateOffChainAgentRewards: 'Agent',
  claimOnChainAgentRewards: 'Agent',
};

const ACCOUNT_REWARD_UPDATE_SKIP_KEYS = new Set(['call', 'meta', 'onChainCalls']);

export const PENDING_REWARDS_INLINE_REFRESH_MS = 10_000;

export const PENDING_REWARDS_CLAIM_TO_ESTIMATE_METHOD: Record<string, PendingRewardsActionClick['method']> = {
  claimOnChainTotalRewards: 'estimateOffChainTotalRewards',
  claimOnChainSponsorRewards: 'estimateOffChainSponsorRewards',
  claimOnChainRecipientRewards: 'estimateOffChainRecipientRewards',
  claimOnChainAgentRewards: 'estimateOffChainAgentRewards',
};

export function parsePendingRewardsActionClick(
  value: string,
  normalizeAddressValue: (value: string) => string,
): PendingRewardsActionClick | null {
  try {
    const parsed = JSON.parse(String(value || '')) as Record<string, unknown>;
    if (!parsed || parsed.__loadPendingRewardsAction !== true) return null;
    const action = String(parsed.action || '').trim().toLowerCase();
    if (action !== 'claim' && action !== 'estimate') return null;
    return {
      accountKey: normalizeAddressValue(toDisplayString(parsed.accountKey)),
      action,
    };
  } catch {
    return null;
  }
}

export function parsePendingRewardsMethodClick(
  value: string,
  normalizeAddressValue: (value: string) => string,
): PendingRewardsActionClick | null {
  try {
    const parsed = JSON.parse(String(value || '')) as Record<string, unknown>;
    if (!parsed || parsed.__loadPendingRewardsMethod !== true) return null;
    const methods = Array.isArray(parsed.methods)
      ? parsed.methods
          .map((entry) => String(entry || '').trim())
          .filter(isPendingRewardsMethodName)
      : [];
    if (methods.length > 0) {
      const firstMethod = methods[0];
      const action = PENDING_REWARDS_ESTIMATE_METHODS.has(firstMethod) ? 'estimate' : 'claim';
      return {
        accountKey: normalizeAddressValue(toDisplayString(parsed.accountKey)),
        action,
        method: firstMethod,
        methods,
      };
    }
    const method = String(parsed.method || '').trim();
    if (!PENDING_REWARDS_ESTIMATE_METHODS.has(method) && !PENDING_REWARDS_CLAIM_METHODS.has(method)) return null;
    return {
      accountKey: normalizeAddressValue(toDisplayString(parsed.accountKey)),
      action: PENDING_REWARDS_ESTIMATE_METHODS.has(method) ? 'estimate' : 'claim',
      method: method as PendingRewardsActionClick['method'],
    };
  } catch {
    return null;
  }
}

export function hasLazyPendingRewardsAction(value: unknown) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).__lazyPendingRewardsAction === true,
  );
}

export function hasLazyPendingRewardsMethod(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.call !== undefined || record.result !== undefined || record.meta !== undefined) return false;
  return record.__lazyPendingRewardsMethod === true;
}

export function hasPendingRewardsRefreshAction(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).__pendingRewardsRefreshAction === true
  ) {
    return true;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const estimate = (value as Record<string, unknown>).estimate;
  if (!estimate || typeof estimate !== 'object' || Array.isArray(estimate)) return false;
  const result = (estimate as Record<string, unknown>).result;
  return Boolean(
    result &&
      typeof result === 'object' &&
      !Array.isArray(result) &&
      (result as Record<string, unknown>).__pendingRewardsRefreshAction === true,
  );
}

export function readPendingRewardsAmount(value: unknown) {
  const normalized = normalizePendingRewardsDisplayResult(value);
  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) return null;
  const normalizedRecord = normalized as Record<string, unknown>;
  const nestedResult = asRecord(normalizedRecord.result);
  const record = nestedResult ?? normalizedRecord;
  const pendingTotalRecord = asRecord(record.pendingTotalRewards);
  const componentTotal =
    toRewardsBigInt(record.pendingSponsorRewards) +
    toRewardsBigInt(record.pendingRecipientRewards) +
    toRewardsBigInt(record.pendingAgentRewards);
  const amount =
    (componentTotal > 0n ? componentTotal.toString() : undefined) ??
    pendingTotalRecord?.total ??
    pendingTotalRecord?.pendingTotalRewards ??
    pendingTotalRecord?.pendingRewards ??
    pendingTotalRecord?.totalRewards ??
    record.pendingRewards ??
    record.pendingTotalRewards ??
    record.totalRewards ??
    record.totalRewardsClaimed ??
    record.claimedAmount;
  if (amount === undefined || amount === null) return null;
  return String(amount);
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasOwn(record: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function toRoleCount(value: unknown) {
  const normalized = String(value ?? '0').replace(/,/g, '').trim();
  if (!normalized || !/^\d+$/.test(normalized)) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function listOrCountLength(listValue: unknown, countValue: unknown) {
  if (countValue !== undefined && countValue !== null && String(countValue).trim() !== '') {
    return toRoleCount(countValue);
  }
  return Array.isArray(listValue) ? listValue.length : 0;
}

function normalizeExplicitRoleNames(value: unknown): PendingRewardsRoleName[] | null {
  const roleText = String(value ?? '').trim();
  if (!roleText) return null;
  if (/^(na|n\/a|none)$/i.test(roleText)) return [];
  const roles: PendingRewardsRoleName[] = [];
  if (/sponsor/i.test(roleText)) roles.push('Sponsor');
  if (/recipient/i.test(roleText)) roles.push('Recipient');
  if (/agent/i.test(roleText)) roles.push('Agent');
  return roles.length > 0 ? roles : null;
}

function buildRoleState(roles: PendingRewardsRoleName[]): PendingRewardsRoleState {
  const uniqueRoles = Array.from(new Set(roles));
  return {
    known: true,
    role: uniqueRoles.length > 0 ? uniqueRoles.join(' / ') : 'NA',
    roles: uniqueRoles,
    isSponsor: uniqueRoles.includes('Sponsor'),
    isRecipient: uniqueRoles.includes('Recipient'),
    isAgent: uniqueRoles.includes('Agent'),
  };
}

function readRoleStateFromRecord(record: Record<string, unknown> | null): PendingRewardsRoleState | null {
  if (!record) return null;

  const explicitRoles = normalizeExplicitRoleNames(record.role ?? record.Role);
  if (explicitRoles) return buildRoleState(explicitRoles);

  if (hasOwn(record, 'roles')) {
    return buildRoleState(resolveSpCoinAccountRoles(record) as PendingRewardsRoleName[]);
  }

  const hasRoleFlags =
    hasOwn(record, 'isSponsor') ||
    hasOwn(record, 'isRecipient') ||
    hasOwn(record, 'isRecipiet') ||
    hasOwn(record, 'isAgent');
  if (hasRoleFlags) {
    return buildRoleState(resolveSpCoinAccountRoles(record) as PendingRewardsRoleName[]);
  }

  const hasRoleCounts =
    hasOwn(record, 'sponsorCount') ||
    hasOwn(record, 'recipientCount') ||
    hasOwn(record, 'agentCount') ||
    hasOwn(record, 'parentRecipientCount') ||
    hasOwn(record, 'recipientRateTransactionSetCount') ||
    hasOwn(record, 'agentRateTransactionSetCount') ||
    hasOwn(record, 'sponsorKeys') ||
    hasOwn(record, 'recipientKeys') ||
    hasOwn(record, 'agentKeys') ||
    hasOwn(record, 'parentRecipientKeys') ||
    hasOwn(record, 'recipientRateTransactionSetKeys') ||
    hasOwn(record, 'agentRateTransactionSetKeys');
  if (!hasRoleCounts) return null;

  const sponsorCount = listOrCountLength(record.sponsorKeys, record.sponsorCount);
  const recipientCount = listOrCountLength(record.recipientKeys, record.recipientCount);
  const agentCount = listOrCountLength(record.agentKeys, record.agentCount);
  const parentRecipientCount = listOrCountLength(record.parentRecipientKeys, record.parentRecipientCount);
  const recipientRateTransactionSetCount = listOrCountLength(
    record.recipientRateTransactionSetKeys,
    record.recipientRateTransactionSetCount,
  );
  const agentRateTransactionSetCount = listOrCountLength(
    record.agentRateTransactionSetKeys,
    record.agentRateTransactionSetCount,
  );
  const roles: PendingRewardsRoleName[] = [];
  if (recipientCount > 0) roles.push('Sponsor');
  if (sponsorCount > 0 || agentCount > 0 || recipientRateTransactionSetCount > 0) roles.push('Recipient');
  if (parentRecipientCount > 0 || agentRateTransactionSetCount > 0) roles.push('Agent');
  return buildRoleState(roles);
}

function readRoleStateFromValue(value: unknown): PendingRewardsRoleState | null {
  const record = asRecord(value);
  if (!record) return null;
  return (
    readRoleStateFromRecord(record) ??
    readRoleStateFromRecord(asRecord(record.result)) ??
    readRoleStateFromRecord(asRecord(record.pendingRewards)) ??
    readRoleStateFromRecord(asRecord(asRecord(record.totalSpCoins)?.pendingRewards))
  );
}

function readFirstRoleState(...values: unknown[]) {
  for (const value of values) {
    const roleState = readRoleStateFromValue(value);
    if (roleState) return roleState;
  }
  return null;
}

function getMethodRole(method: unknown) {
  return PENDING_REWARDS_METHOD_ROLE[String(method ?? '').trim()] ?? null;
}

function shouldIncludePendingRewardsMethod(method: unknown, roleState: PendingRewardsRoleState | null) {
  const methodRole = getMethodRole(method);
  if (!methodRole || !roleState?.known) return true;
  if (methodRole === 'Sponsor') return roleState.isSponsor;
  if (methodRole === 'Recipient') return roleState.isRecipient;
  return roleState.isAgent;
}

function withRoleStateFields<T extends Record<string, unknown>>(record: T, roleState: PendingRewardsRoleState | null): T {
  if (!roleState?.known) return record;
  return {
    ...record,
    role: roleState.role,
    isSponsor: roleState.isSponsor,
    isRecipient: roleState.isRecipient,
    isAgent: roleState.isAgent,
  };
}

function prunePendingRewardsRoleMethods<T extends Record<string, unknown>>(record: T, roleState: PendingRewardsRoleState | null): T {
  if (!roleState?.known) return record;
  const next = { ...record };
  for (const method of Object.keys(PENDING_REWARDS_METHOD_ROLE)) {
    if (!shouldIncludePendingRewardsMethod(method, roleState)) delete next[method];
  }
  return withRoleStateFields(next, roleState) as T;
}

function isPendingRewardsBranch(record: Record<string, unknown>) {
  return record.TYPE === '--PENDING_REWARDS--' ||
    PENDING_REWARDS_METHOD_KEYS.some((method) => hasOwn(record, method)) ||
    hasOwn(record, 'pendingRewards') ||
    hasOwn(record, 'pendingSponsorRewards') ||
    hasOwn(record, 'pendingRecipientRewards') ||
    hasOwn(record, 'pendingAgentRewards');
}

function isAccountRoleRecord(record: Record<string, unknown>) {
  return record.TYPE === '--ACCOUNT--' ||
    Boolean(record.totalSpCoins && typeof record.totalSpCoins === 'object' && !Array.isArray(record.totalSpCoins)) ||
    Boolean(readRoleStateFromRecord(record));
}

export function normalizePendingRewardsRoleDisplayTree(value: unknown, inheritedRoleState: PendingRewardsRoleState | null = null): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((entry) => normalizePendingRewardsRoleDisplayTree(entry, inheritedRoleState));
  }

  const record = value as Record<string, unknown>;
  const rawOwnRoleState = readRoleStateFromRecord(record);
  const ownRoleState =
    record.TYPE === '--PENDING_REWARDS--' &&
    rawOwnRoleState?.known &&
    rawOwnRoleState.roles.length === 0 &&
    inheritedRoleState?.known &&
    inheritedRoleState.roles.length > 0
      ? inheritedRoleState
      : rawOwnRoleState;
  const roleState = ownRoleState ?? inheritedRoleState;
  const isAccount = isAccountRoleRecord(record);
  const nextRoleState = isAccount ? (ownRoleState ?? readRoleStateFromRecord(record) ?? inheritedRoleState) : roleState;
  const next: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(record)) {
    if (
      nextRoleState?.known &&
      PENDING_REWARDS_METHOD_ROLE[key] &&
      !shouldIncludePendingRewardsMethod(key, nextRoleState)
    ) {
      continue;
    }
    const childRoleState =
      key === 'pendingRewards' || key === 'totalSpCoins' || isPendingRewardsBranch(record)
        ? nextRoleState
        : roleState;
    next[key] = normalizePendingRewardsRoleDisplayTree(entry, childRoleState);
  }

  const normalized = isPendingRewardsBranch(next)
    ? prunePendingRewardsRoleMethods(next, nextRoleState)
    : isAccount && nextRoleState?.known
      ? withRoleStateFields(next, nextRoleState)
      : next;
  return normalized;
}

export function isLoadedPendingRewardsMethodNode(value: unknown) {
  const record = asRecord(value);
  return Boolean(record && (record.call || record.meta || record.result || record.onChainCalls));
}

export function buildLazyPendingRewardsMethod(accountKey: string, method: string) {
  return {
    __lazyPendingRewardsMethod: true,
    accountKey,
    method,
  };
}

export function buildZeroPendingRewardsEstimateResult(accountKey: string, method: string) {
  const result: Record<string, unknown> = {
    TYPE: '--ACCOUNT_PENDING_REWARDS--',
    accountKey,
    pendingRewards: '0',
    pendingTotalRewards: '0',
    totalRewards: '0',
    __showEmptyFields: true,
    __pendingRewardsRefreshAction: true,
    __pendingRewardsRefreshAtMs: Date.now() + PENDING_REWARDS_INLINE_REFRESH_MS,
    __pendingRewardsRefreshActionName: 'estimate',
  };
  if (method === 'estimateOffChainSponsorRewards') result.pendingSponsorRewards = '0';
  if (method === 'estimateOffChainRecipientRewards') result.pendingRecipientRewards = '0';
  if (method === 'estimateOffChainAgentRewards') result.pendingAgentRewards = '0';
  if (method === 'estimateOffChainTotalRewards') {
    result.pendingSponsorRewards = '0';
    result.pendingRecipientRewards = '0';
    result.pendingAgentRewards = '0';
  }
  return result;
}

export type PendingRewardsAllRoles = {
  pendingSponsorRewards?: unknown;
  pendingRecipientRewards?: unknown;
  pendingAgentRewards?: unknown;
  claimedSponsorRewards?: unknown;
  claimedRecipientRewards?: unknown;
  claimedAgentRewards?: unknown;
  claimedRewards?: unknown;
};

export type PendingRewardsByAccount = Record<string, PendingRewardsAllRoles & { accountKey?: unknown; pendingRewards?: unknown }>;

export function getPendingRewardsRoleForMethod(method: unknown): string {
  return resolveSpCoinMethodRole(method);
}

function getPendingRewardsRoleForValue(value: unknown): string {
  const record = asRecord(value);
  if (!record) return '';
  const roleState = readRoleStateFromRecord(record) ?? readRoleStateFromRecord(asRecord(record.result));
  if (roleState?.known) return roleState.role;
  const accountRoleLabel =
    resolveSpCoinAccountRoleLabel(record) ||
    resolveSpCoinAccountRoleLabel(record.result);
  if (accountRoleLabel) return accountRoleLabel;
  return getPendingRewardsRoleForValue(record.result);
}

export function withPendingRewardsRoleMeta(meta: unknown, method: unknown, value?: unknown) {
  const valueRoleState = readRoleStateFromValue(value);
  const role = valueRoleState?.known
    ? valueRoleState.role
    : getPendingRewardsRoleForValue(value) || getPendingRewardsRoleForMethod(method);
  const metaRecord = asRecord(meta);
  if (!role) return metaRecord ?? meta;
  return {
    ...(metaRecord ?? {}),
    Role: role,
  };
}

function readPendingRewardsAllRoles(value: unknown): PendingRewardsAllRoles | null {
  const record = asRecord(value);
  const direct = asRecord(record?.__pendingRewardsAllRoles);
  if (direct) return direct;
  const result = asRecord(record?.result);
  const nested = asRecord(result?.__pendingRewardsAllRoles);
  if (nested) return nested;
  return null;
}

export function readPendingRewardsByAccount(value: unknown): PendingRewardsByAccount | null {
  const record = asRecord(value);
  const direct = asRecord(record?.__pendingRewardsByAccount);
  if (direct) return direct as PendingRewardsByAccount;
  const result = asRecord(record?.result);
  const nested = asRecord(result?.__pendingRewardsByAccount);
  if (nested) return nested as PendingRewardsByAccount;
  return null;
}

export function findPendingRewardsByAccount(value: unknown): PendingRewardsByAccount | null {
  const direct = readPendingRewardsByAccount(value);
  if (direct) return direct;
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findPendingRewardsByAccount(entry);
      if (found) return found;
    }
    return null;
  }
  for (const entry of Object.values(value as Record<string, unknown>)) {
    const found = findPendingRewardsByAccount(entry);
    if (found) return found;
  }
  return null;
}

export function buildZeroPendingRewardsByAccount(
  rewardsByAccount: PendingRewardsByAccount | null,
): PendingRewardsByAccount | null {
  if (!rewardsByAccount) return null;
  const zeroed: PendingRewardsByAccount = {};
  for (const [mapKey, accountRewards] of Object.entries(rewardsByAccount)) {
    const accountKey = String(accountRewards.accountKey ?? mapKey);
    const normalizedAccountKey = normalizeAccountKeyValue(accountKey);
    if (!normalizedAccountKey) continue;
    zeroed[normalizedAccountKey] = {
      accountKey,
      pendingSponsorRewards: '0',
      pendingRecipientRewards: '0',
      pendingAgentRewards: '0',
      pendingRewards: '0',
    };
  }
  return Object.keys(zeroed).length > 0 ? zeroed : null;
}

export function buildZeroClaimedRewardsByAccount(
  rewardsByAccount: PendingRewardsByAccount | null,
): PendingRewardsByAccount | null {
  if (!rewardsByAccount) return null;
  const zeroed: PendingRewardsByAccount = {};
  for (const [mapKey, accountRewards] of Object.entries(rewardsByAccount)) {
    const accountKey = String(accountRewards.accountKey ?? mapKey);
    const normalizedAccountKey = normalizeAccountKeyValue(accountKey);
    if (!normalizedAccountKey) continue;
    zeroed[normalizedAccountKey] = {
      accountKey,
      claimedSponsorRewards: '0',
      claimedRecipientRewards: '0',
      claimedAgentRewards: '0',
      claimedRewards: '0',
    };
  }
  return Object.keys(zeroed).length > 0 ? zeroed : null;
}

export function readClaimedRewardsByAccount(value: unknown): PendingRewardsByAccount | null {
  const record = asRecord(value);
  const direct = asRecord(record?.__claimedRewardsByAccount);
  if (direct) return direct as PendingRewardsByAccount;
  const result = asRecord(record?.result);
  const nested = asRecord(result?.__claimedRewardsByAccount);
  if (nested) return nested as PendingRewardsByAccount;
  return null;
}

export function buildClaimedRewardsByAccount(
  accountKey: string,
  method: string,
  claimedAmount: unknown,
): PendingRewardsByAccount | null {
  const normalizedAccountKey = normalizeAccountKeyValue(accountKey);
  if (!normalizedAccountKey) return null;
  const amount = String(claimedAmount ?? '').trim();
  if (!amount) return null;
  const entry: PendingRewardsAllRoles & { accountKey: string; claimedRewards: string } = {
    accountKey,
    claimedRewards: amount,
  };
  if (method === 'claimOnChainSponsorRewards') entry.claimedSponsorRewards = amount;
  if (method === 'claimOnChainRecipientRewards') entry.claimedRecipientRewards = amount;
  if (method === 'claimOnChainAgentRewards') entry.claimedAgentRewards = amount;
  if (method === 'claimOnChainTotalRewards') {
    entry.claimedSponsorRewards = amount;
    entry.claimedRecipientRewards = amount;
    entry.claimedAgentRewards = amount;
  }
  return {
    [normalizedAccountKey]: entry,
  };
}

export function buildClaimedRewardsByAccountFromPendingRewards(
  rewardsByAccount: PendingRewardsByAccount | null,
  method: string,
): PendingRewardsByAccount | null {
  if (!rewardsByAccount) return null;
  const claimedByAccount: PendingRewardsByAccount = {};
  const toRewardAmountText = (value: unknown) => String(value ?? '0').replace(/,/g, '').trim() || '0';
  for (const [mapKey, accountRewards] of Object.entries(rewardsByAccount)) {
    const accountKey = String(accountRewards.accountKey ?? mapKey);
    const normalizedAccountKey = normalizeAccountKeyValue(accountKey);
    if (!normalizedAccountKey) continue;

    const pendingSponsorRewards = toRewardAmountText(accountRewards.pendingSponsorRewards);
    const pendingRecipientRewards = toRewardAmountText(accountRewards.pendingRecipientRewards);
    const pendingAgentRewards = toRewardAmountText(accountRewards.pendingAgentRewards);
    const claimedSponsorRewards =
      method === 'claimOnChainSponsorRewards' || method === 'claimOnChainTotalRewards'
        ? pendingSponsorRewards
        : '0';
    const claimedRecipientRewards =
      method === 'claimOnChainRecipientRewards' || method === 'claimOnChainTotalRewards'
        ? pendingRecipientRewards
        : '0';
    const claimedAgentRewards =
      method === 'claimOnChainAgentRewards' || method === 'claimOnChainTotalRewards'
        ? pendingAgentRewards
        : '0';
    const claimedRewards = addRewardAmountStrings(
      addRewardAmountStrings(claimedSponsorRewards, claimedRecipientRewards),
      claimedAgentRewards,
    );

    claimedByAccount[normalizedAccountKey] = {
      accountKey,
      claimedSponsorRewards,
      claimedRecipientRewards,
      claimedAgentRewards,
      claimedRewards,
    };
  }
  return Object.keys(claimedByAccount).length > 0 ? claimedByAccount : null;
}

function readPendingRewardsAllRolesAmount(allRoles: PendingRewardsAllRoles | null, method: string) {
  if (!allRoles) return null;
  const value =
    method === 'estimateOffChainSponsorRewards'
      ? allRoles.pendingSponsorRewards
      : method === 'estimateOffChainRecipientRewards'
        ? allRoles.pendingRecipientRewards
        : method === 'estimateOffChainAgentRewards'
          ? allRoles.pendingAgentRewards
          : method === 'estimateOffChainTotalRewards'
            ? toRewardsBigInt(allRoles.pendingSponsorRewards) +
              toRewardsBigInt(allRoles.pendingRecipientRewards) +
              toRewardsBigInt(allRoles.pendingAgentRewards)
            : null;
  return value === null || value === undefined ? null : String(value);
}

function readClaimedRewardsAllRolesAmount(allRoles: PendingRewardsAllRoles | null, method: string) {
  if (!allRoles) return null;
  const value =
    method === 'claimOnChainSponsorRewards'
      ? allRoles.claimedSponsorRewards
      : method === 'claimOnChainRecipientRewards'
        ? allRoles.claimedRecipientRewards
        : method === 'claimOnChainAgentRewards'
          ? allRoles.claimedAgentRewards
          : method === 'claimOnChainTotalRewards'
            ? allRoles.claimedRewards ??
              toRewardsBigInt(allRoles.claimedSponsorRewards) +
              toRewardsBigInt(allRoles.claimedRecipientRewards) +
              toRewardsBigInt(allRoles.claimedAgentRewards)
            : null;
  return value === null || value === undefined ? null : String(value);
}

function readClaimedRewardsTotalAmount(allRoles: PendingRewardsAllRoles | null) {
  if (!allRoles) return null;
  const direct = allRoles.claimedRewards;
  if (direct !== undefined && direct !== null) {
    const directText = String(direct).replace(/,/g, '').trim();
    return directText && directText !== '0' ? String(direct) : null;
  }
  const total = addRewardAmountStrings(
    addRewardAmountStrings(allRoles.claimedSponsorRewards, allRoles.claimedRecipientRewards),
    allRoles.claimedAgentRewards,
  );
  return total === '0' ? null : total;
}

function getClaimFieldForAccountRole(role: unknown): keyof PendingRewardsAllRoles | null {
  const roleText = toDisplayString(role).trim().toLowerCase();
  if (roleText === 'sponsor') return 'claimedSponsorRewards';
  if (roleText === 'recipient') return 'claimedRecipientRewards';
  if (roleText === 'agent') return 'claimedAgentRewards';
  return null;
}

function readClaimedRewardsForAccountRecord(
  accountClaims: PendingRewardsAllRoles | null,
  accountRecord: Record<string, unknown>,
) {
  if (!accountClaims) return null;
  const claimField = getClaimFieldForAccountRole(accountRecord.role);
  if (claimField) {
    const roleAmount = normalizeRewardAmountText(accountClaims[claimField]);
    if (roleAmount && roleAmount !== '0') return accountClaims[claimField];
  }
  return readClaimedRewardsTotalAmount(accountClaims);
}

function addRewardAmountStrings(left: unknown, right: unknown) {
  const leftText = String(left ?? '0').replace(/,/g, '').trim();
  const rightText = String(right ?? '0').replace(/,/g, '').trim();
  if (!leftText || leftText === '0') return rightText || '0';
  if (!rightText || rightText === '0') return leftText || '0';

  const decimalScale = Math.max(
    leftText.includes('.') ? leftText.split('.')[1]?.length ?? 0 : 0,
    rightText.includes('.') ? rightText.split('.')[1]?.length ?? 0 : 0,
  );
  const toScaledBigInt = (value: string) => {
    const [wholePart, fractionPart = ''] = value.split('.');
    return BigInt(`${wholePart || '0'}${fractionPart.padEnd(decimalScale, '0')}`);
  };
  const total = toScaledBigInt(leftText) + toScaledBigInt(rightText);
  if (decimalScale === 0) return total.toString();
  const padded = total.toString().padStart(decimalScale + 1, '0');
  const whole = padded.slice(0, -decimalScale) || '0';
  const fraction = padded.slice(-decimalScale).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

function addBaseUnitAmountStrings(left: unknown, right: unknown) {
  const leftText = String(left ?? '0').replace(/,/g, '').trim();
  const rightText = String(right ?? '0').replace(/,/g, '').trim();
  const leftAmount = /^\d+$/.test(leftText) ? BigInt(leftText) : 0n;
  const rightAmount = /^\d+$/.test(rightText) ? BigInt(rightText) : 0n;
  return (leftAmount + rightAmount).toString();
}

function normalizeRewardAmountText(value: unknown) {
  return String(value ?? '').replace(/,/g, '').trim();
}

function formatBaseUnitRewardAmount(value: unknown) {
  const text = normalizeRewardAmountText(value);
  if (!text || text === '0') return '0';
  if (text.includes('.')) return text;
  if (!/^\d+$/.test(text)) return text;

  const base = 1_000_000_000_000_000_000n;
  const amount = BigInt(text);
  const whole = amount / base;
  const fraction = amount % base;
  if (fraction === 0n) return whole.toString();
  return `${whole}.${fraction.toString().padStart(18, '0').replace(/0+$/, '')}`;
}

function addClaimedRewardsToTotalSpCoins(value: unknown, claimedRewardsDisplayAmount: string) {
  if (!claimedRewardsDisplayAmount || claimedRewardsDisplayAmount === '0') return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return addRewardAmountStrings(value, claimedRewardsDisplayAmount);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const next = { ...record };
  if (next.totalSpCoins !== undefined) {
    next.totalSpCoins = addRewardAmountStrings(next.totalSpCoins, claimedRewardsDisplayAmount);
  }
  if (next.balanceOf !== undefined) {
    next.balanceOf = addRewardAmountStrings(next.balanceOf, claimedRewardsDisplayAmount);
  }
  return next;
}

function normalizeAccountKeyValue(value: unknown) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object' || typeof value === 'function' || typeof value === 'symbol') return '';
  return String(value ?? '').trim().toLowerCase();
}

function readPendingRewardsBranchAccountKey(value: unknown) {
  const record = asRecord(value);
  if (!record) return '';
  const directAccount = normalizeAccountKeyValue(record.accountKey);
  if (directAccount) return directAccount;
  for (const method of PENDING_REWARDS_METHOD_KEYS) {
    const methodRecord = asRecord(record[method]);
    const methodAccount = normalizeAccountKeyValue(methodRecord?.accountKey);
    if (methodAccount) return methodAccount;
    const resultAccount = normalizeAccountKeyValue(asRecord(methodRecord?.result)?.accountKey);
    if (resultAccount) return resultAccount;
    const callParameters = asRecord(asRecord(methodRecord?.call)?.parameters);
    const callAccount = normalizeAccountKeyValue(callParameters?.['Account Key'] ?? callParameters?.Account);
    if (callAccount) return callAccount;
  }
  return '';
}

function getAccountRewardsFromMap(rewardsByAccount: PendingRewardsByAccount | null, accountKey: string) {
  if (!rewardsByAccount || !accountKey) return null;
  return (rewardsByAccount[accountKey] ?? rewardsByAccount[accountKey.toLowerCase()]) || null;
}

function resolveClaimedAccountKeyForRecord(
  record: Record<string, unknown>,
  rewardsByAccount: PendingRewardsByAccount,
) {
  const claimField = getClaimFieldForAccountRole(record.role);
  if (!claimField) return '';
  const matches = Object.entries(rewardsByAccount)
    .filter(([, accountClaims]) => {
      const amount = normalizeRewardAmountText(accountClaims[claimField]);
      return amount !== '' && amount !== '0';
    })
    .map(([accountKey, accountClaims]) => normalizeAccountKeyValue(accountClaims.accountKey ?? accountKey))
    .filter(Boolean);
  const uniqueMatches = Array.from(new Set(matches));
  return uniqueMatches.length === 1 ? uniqueMatches[0] : '';
}

function readCallAccountKey(value: unknown) {
  const record = asRecord(value);
  const callParameters = asRecord(asRecord(record?.call)?.parameters);
  return normalizeAccountKeyValue(callParameters?.['Account Key'] ?? callParameters?.Account);
}

function readRelationItemAccountKey(value: unknown) {
  const record = asRecord(value);
  return normalizeAccountKeyValue(record?.accountKey ?? record?.address ?? record?.key ?? record?.[0] ?? record?.value);
}

function readAccountContextKey(value: unknown) {
  return readAccountRecordKey(value) || readRelationItemAccountKey(value) || readCallAccountKey(value);
}

function readChildAccountContextKey(
  parent: Record<string, unknown>,
  childKey: string,
  childValue: unknown,
  inheritedAccountKey: string,
) {
  const childAccountKey = readAccountContextKey(childValue);
  if (childAccountKey) return childAccountKey;
  if (childKey === 'result') {
    const wrapperAccountKey = readRelationItemAccountKey(parent) || readCallAccountKey(parent);
    if (wrapperAccountKey) return wrapperAccountKey;
  }
  if (childKey === 'totalSpCoins' || childKey === 'pendingRewards') {
    return readAccountRecordKey(parent) || inheritedAccountKey;
  }
  return inheritedAccountKey;
}

export function mergePendingRewardsByAccountIntoTree(
  value: unknown,
  rewardsByAccount: PendingRewardsByAccount | null,
  refreshAtMs: number,
): unknown {
  if (!rewardsByAccount || !value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((entry) => mergePendingRewardsByAccountIntoTree(entry, rewardsByAccount, refreshAtMs));
  }
  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (ACCOUNT_REWARD_UPDATE_SKIP_KEYS.has(key)) {
      next[key] = entry;
      continue;
    }
    next[key] = mergePendingRewardsByAccountIntoTree(entry, rewardsByAccount, refreshAtMs);
  }

  if (next.TYPE === '--PENDING_REWARDS--') {
    const accountKey = readPendingRewardsBranchAccountKey(next);
    const accountRewards = getAccountRewardsFromMap(rewardsByAccount, accountKey);
    const roleState = readFirstRoleState(next, accountRewards);
    if (accountRewards) {
      for (const method of PENDING_REWARDS_ESTIMATE_METHODS) {
        const methodName = String(method);
        if (!shouldIncludePendingRewardsMethod(methodName, roleState)) {
          delete next[methodName];
          continue;
        }
        const amount = readPendingRewardsAllRolesAmount(accountRewards, methodName);
        if (amount === null) continue;
        next[methodName] = mergeMethodResultAmount(
          next[methodName] ?? buildLazyPendingRewardsMethod(accountKey, methodName),
          amount,
          methodName,
          accountKey,
          accountRewards,
        );
      }
      next.pendingRewards = String(
        accountRewards.pendingRewards ??
          toRewardsBigInt(accountRewards.pendingSponsorRewards) +
            toRewardsBigInt(accountRewards.pendingRecipientRewards) +
            toRewardsBigInt(accountRewards.pendingAgentRewards),
      );
      next.__pendingRewardsRefreshAction = true;
      next.__pendingRewardsRefreshAtMs = refreshAtMs;
      next.__pendingRewardsRefreshActionName = 'estimate';
    }
    return prunePendingRewardsRoleMethods(next, roleState);
  }
  return next;
}

function mergeClaimMethodResultAmount(
  methodNode: unknown,
  amount: string | null,
  method: string,
  normalizedAccount: string,
  claimedRewards?: PendingRewardsAllRoles | null,
) {
  if (amount === null) return methodNode;
  const record = asRecord(methodNode);
  const result = asRecord(record?.result);
  const nextResult: Record<string, unknown> = {
    ...(result ?? {}),
    claimedAmount: amount,
    totalRewardsClaimed: amount,
    __showEmptyFields: true,
    ...(claimedRewards ? { __claimedRewardsAllRoles: claimedRewards } : {}),
  };
  const {
    __lazyPendingRewardsMethod: _lazyPendingRewardsMethod,
    __pendingRewardsIncludedMethod: _pendingRewardsIncludedMethod,
    method: _placeholderMethod,
    accountKey: _placeholderAccountKey,
    ...nextRecord
  } = record ?? {};
  return {
    ...nextRecord,
    call: asRecord(nextRecord.call) ?? {
      method,
      parameters: { 'Account Key': normalizedAccount },
      selectedMethod: method,
    },
    meta: withPendingRewardsRoleMeta(nextRecord.meta, method, nextResult),
    result: nextResult,
    __showEmptyFields: true,
  };
}

export function updateAccountClaimedRewards(
  value: unknown,
  claimedRewardsByAccount: PendingRewardsByAccount | null,
  inheritedAccountKey = '',
): unknown {
  if (!claimedRewardsByAccount || !value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((entry) => updateAccountClaimedRewards(entry, claimedRewardsByAccount, inheritedAccountKey));
  }
  const record = value as Record<string, unknown>;
  const accountContextKey = readAccountContextKey(record) || inheritedAccountKey;
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (ACCOUNT_REWARD_UPDATE_SKIP_KEYS.has(key)) {
      next[key] = entry;
      continue;
    }
    next[key] = updateAccountClaimedRewards(
      entry,
      claimedRewardsByAccount,
      readChildAccountContextKey(record, key, entry, accountContextKey),
    );
  }

  if (next.TYPE === '--PENDING_REWARDS--') {
    const accountKey = readPendingRewardsBranchAccountKey(next) || accountContextKey;
    const accountClaims = getAccountRewardsFromMap(claimedRewardsByAccount, accountKey);
    const roleState = readFirstRoleState(next, accountClaims);
    if (accountClaims) {
      for (const method of PENDING_REWARDS_CLAIM_METHODS) {
        const methodName = String(method);
        if (!shouldIncludePendingRewardsMethod(methodName, roleState)) {
          delete next[methodName];
          continue;
        }
        const amount = readClaimedRewardsAllRolesAmount(accountClaims, methodName);
        if (amount === null) continue;
        next[methodName] = mergeClaimMethodResultAmount(
          next[methodName] ?? buildLazyPendingRewardsMethod(accountKey, methodName),
          amount,
          methodName,
          accountKey,
          accountClaims,
        );
      }
    }
    return prunePendingRewardsRoleMethods(next, roleState);
  }
  return next;
}

export function updateAccountPendingEstimate(
  value: unknown,
  claimedRewardsByAccount: PendingRewardsByAccount | null,
  inheritedAccountKey = '',
): unknown {
  if (!claimedRewardsByAccount || !value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((entry) => updateAccountPendingEstimate(entry, claimedRewardsByAccount, inheritedAccountKey));
  }
  const record = value as Record<string, unknown>;
  const accountContextKey = readAccountContextKey(record) || inheritedAccountKey;
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (ACCOUNT_REWARD_UPDATE_SKIP_KEYS.has(key)) {
      next[key] = entry;
      continue;
    }
    next[key] = updateAccountPendingEstimate(
      entry,
      claimedRewardsByAccount,
      readChildAccountContextKey(record, key, entry, accountContextKey),
    );
  }

  if (next.TYPE === '--PENDING_REWARDS--') {
    const accountKey = readPendingRewardsBranchAccountKey(next) || accountContextKey;
    const accountClaims = getAccountRewardsFromMap(claimedRewardsByAccount, accountKey);
    const roleState = readFirstRoleState(next, accountClaims);
    if (accountClaims) {
      next.pendingRewards = '0';
      const estimateMethodsByClaimField = [
        ['claimedSponsorRewards', 'estimateOffChainSponsorRewards'],
        ['claimedRecipientRewards', 'estimateOffChainRecipientRewards'],
        ['claimedAgentRewards', 'estimateOffChainAgentRewards'],
      ] as const;
      for (const [claimField, estimateMethod] of estimateMethodsByClaimField) {
        if (!shouldIncludePendingRewardsMethod(estimateMethod, roleState)) {
          delete next[estimateMethod];
          continue;
        }
        const amount = accountClaims[claimField];
        if (normalizeRewardAmountText(amount) && normalizeRewardAmountText(amount) !== '0') {
          next[estimateMethod] = mergeMethodResultAmount(
            next[estimateMethod] ?? buildLazyPendingRewardsMethod(accountKey, estimateMethod),
            '0',
            estimateMethod,
            accountKey,
            accountClaims,
          );
        }
      }
      const claimedTotal = readClaimedRewardsTotalAmount(accountClaims);
      if (claimedTotal !== null) {
        next.estimateOffChainTotalRewards = mergeMethodResultAmount(
          next.estimateOffChainTotalRewards ?? buildLazyPendingRewardsMethod(accountKey, 'estimateOffChainTotalRewards'),
          '0',
          'estimateOffChainTotalRewards',
          accountKey,
          accountClaims,
        );
      }
    }
    return prunePendingRewardsRoleMethods(next, roleState);
  }
  return next;
}

export function updateAccountRewardsEarned(
  value: unknown,
  claimedRewardsByAccount: PendingRewardsByAccount | null,
  inheritedAccountKey = '',
): unknown {
  if (!claimedRewardsByAccount || !value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((entry) => updateAccountRewardsEarned(entry, claimedRewardsByAccount, inheritedAccountKey));
  }
  const record = value as Record<string, unknown>;
  const accountContextKey = readAccountContextKey(record) || inheritedAccountKey;
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (ACCOUNT_REWARD_UPDATE_SKIP_KEYS.has(key)) {
      next[key] = entry;
      continue;
    }
    next[key] = updateAccountRewardsEarned(
      entry,
      claimedRewardsByAccount,
      readChildAccountContextKey(record, key, entry, accountContextKey),
    );
  }

  if (isAccountRecordNode(next)) {
    const directAccountKey = readAccountRecordKey(next);
    const fallbackAccountKey = accountContextKey;
    const roleResolvedAccountKey = resolveClaimedAccountKeyForRecord(next, claimedRewardsByAccount);
    const accountKey = directAccountKey || fallbackAccountKey || roleResolvedAccountKey;
    const accountClaims = getAccountRewardsFromMap(claimedRewardsByAccount, accountKey);
    const claimedRewards = readClaimedRewardsForAccountRecord(accountClaims, next);
    if (accountClaims && claimedRewards !== undefined && claimedRewards !== null) {
      const claimedRewardsDisplayAmount = formatBaseUnitRewardAmount(claimedRewards);
      const claimedRewardsBaseAmount = normalizeRewardAmountText(claimedRewards);
      next.rewardsEarned = addRewardAmountStrings(next.rewardsEarned, claimedRewardsDisplayAmount);
      if (next.stakingRewards !== undefined) {
        next.stakingRewards = addBaseUnitAmountStrings(next.stakingRewards, claimedRewardsBaseAmount);
      }
      if (next.accountStakingRewards !== undefined) {
        next.accountStakingRewards = addBaseUnitAmountStrings(next.accountStakingRewards, claimedRewardsBaseAmount);
      }
      next.totalSpCoins = addClaimedRewardsToTotalSpCoins(next.totalSpCoins, claimedRewardsDisplayAmount);
    }
  }
  return next;
}

export function mergeClaimedRewardsByAccountIntoTree(
  value: unknown,
  claimedRewardsByAccount: PendingRewardsByAccount | null,
): unknown {
  if (!claimedRewardsByAccount || !value || typeof value !== 'object') return value;
  return updateAccountRewardsEarned(
    updateAccountPendingEstimate(updateAccountClaimedRewards(value, claimedRewardsByAccount), claimedRewardsByAccount),
    claimedRewardsByAccount,
  );
}

export function normalizePendingRewardsEstimateResult(value: unknown) {
  return normalizePendingRewardsDisplayResult(value);
}

function readPendingRewardsMethodAmount(pendingRewardsBranch: unknown, method: string) {
  const normalized = normalizePendingRewardsDisplayResult(pendingRewardsBranch);
  const record = asRecord(normalized) ?? asRecord(pendingRewardsBranch);
  if (!record) return null;

  const keys =
    method === 'estimateOffChainRecipientRewards'
      ? ['pendingRecipientRewards', 'recipientRewards', 'pendingRewards']
      : method === 'estimateOffChainAgentRewards'
        ? ['pendingAgentRewards', 'agentRewards', 'pendingRewards']
        : method === 'estimateOffChainSponsorRewards'
          ? ['pendingSponsorRewards', 'sponsorRewards', 'pendingRewards']
          : ['pendingTotalRewards', 'totalRewards', 'pendingRewards'];

  for (const key of keys) {
    const value = record[key];
    if (key === 'pendingTotalRewards') {
      const totalRecord = asRecord(value);
      const totalValue =
        totalRecord?.total ??
        totalRecord?.pendingTotalRewards ??
        totalRecord?.pendingRewards ??
        totalRecord?.totalRewards;
      if (totalValue !== undefined && totalValue !== null) return String(totalValue);
    }
    if (value !== undefined && value !== null) return String(value);
  }
  return readPendingRewardsAmount(record);
}

function mergeMethodResultAmount(
  methodNode: unknown,
  amount: string | null,
  method: string,
  normalizedAccount: string,
  allRoles?: PendingRewardsAllRoles | null,
) {
  if (amount === null) return methodNode;
  const record = asRecord(methodNode);
  const result = asRecord(record?.result);
  if (!record || !result) {
    const nextResult = buildZeroPendingRewardsEstimateResult(normalizedAccount, method);
    nextResult.pendingRewards = amount;
    nextResult.pendingTotalRewards = amount;
    nextResult.totalRewards = amount;
    if (method === 'estimateOffChainSponsorRewards') nextResult.pendingSponsorRewards = amount;
    if (method === 'estimateOffChainRecipientRewards') nextResult.pendingRecipientRewards = amount;
    if (method === 'estimateOffChainAgentRewards') nextResult.pendingAgentRewards = amount;
    if (allRoles) nextResult.__pendingRewardsAllRoles = allRoles;
    return {
      call: {
        method,
        parameters: { 'Account Key': normalizedAccount },
        selectedMethod: method,
      },
      meta: withPendingRewardsRoleMeta(undefined, method, nextResult),
      result: nextResult,
      __showEmptyFields: true,
    };
  }

  const nextResult = { ...result };
  const commonKeys = ['pendingRewards', 'pendingTotalRewards', 'totalRewards'];
  for (const key of commonKeys) {
    if (key in nextResult) nextResult[key] = amount;
  }
  if (method === 'estimateOffChainSponsorRewards' && 'pendingSponsorRewards' in nextResult) {
    nextResult.pendingSponsorRewards = amount;
  }
  if (method === 'estimateOffChainRecipientRewards' && 'pendingRecipientRewards' in nextResult) {
    nextResult.pendingRecipientRewards = amount;
  }
  if (method === 'estimateOffChainAgentRewards' && 'pendingAgentRewards' in nextResult) {
    nextResult.pendingAgentRewards = amount;
  }
  if (allRoles) nextResult.__pendingRewardsAllRoles = allRoles;

  return {
    ...record,
    meta: withPendingRewardsRoleMeta(record.meta, method, nextResult),
    result: nextResult,
  };
}

export function mergePendingRewardsBranchForAccountRefresh(
  existingNode: unknown,
  refreshedNode: unknown,
  normalizedAccount: string,
  loadedMethod: string,
  loadedMethodNode: unknown,
  action: PendingRewardsActionClick['action'],
  refreshAtMs: number,
) {
  const existing = asRecord(existingNode) ?? {};
  const refreshed = asRecord(refreshedNode) ?? {};
  const next: Record<string, unknown> = {
    ...refreshed,
    TYPE: refreshed.TYPE ?? existing.TYPE ?? '--PENDING_REWARDS--',
  };
  const loadedAllRoles =
    readPendingRewardsAllRoles(loadedMethodNode) ??
    readPendingRewardsAllRoles(existing) ??
    readPendingRewardsAllRoles(refreshed);
  const roleState = readFirstRoleState(loadedMethodNode, existing, refreshed);

  for (const method of PENDING_REWARDS_METHOD_KEYS) {
    const methodName = String(method);
    if (!shouldIncludePendingRewardsMethod(methodName, roleState)) {
      delete next[method];
      continue;
    }
    const candidate =
      loadedMethod === methodName
        ? loadedMethodNode
        : isLoadedPendingRewardsMethodNode(existing[method])
          ? existing[method]
          : refreshed[method] ?? existing[method] ?? buildLazyPendingRewardsMethod(normalizedAccount, methodName);

    next[method] = PENDING_REWARDS_ESTIMATE_METHODS.has(methodName)
      ? mergeMethodResultAmount(
          candidate,
          (loadedMethod === methodName ? readPendingRewardsMethodAmount(candidate, methodName) : null) ??
            readPendingRewardsAllRolesAmount(loadedAllRoles, methodName) ??
            readPendingRewardsMethodAmount(candidate, methodName) ??
            readPendingRewardsMethodAmount(existing, methodName) ??
            readPendingRewardsMethodAmount(refreshed, methodName),
          methodName,
          normalizedAccount,
          loadedAllRoles,
        )
      : candidate;
  }

  next.pendingRewards = String(existing.pendingRewards ?? refreshed.pendingRewards ?? '0');
  next.__pendingRewardsRefreshAction = true;
  next.__pendingRewardsRefreshAtMs = refreshAtMs;
  next.__pendingRewardsRefreshActionName = action;
  return prunePendingRewardsRoleMethods(next, roleState);
}

export function mergePendingRewardsSummaryNode(
  existingNode: unknown,
  pendingResult: unknown,
  normalizedAccount: string,
  action: PendingRewardsActionClick['action'],
  refreshAtMs: number,
  loadedMethod: string,
  loadedMethodNode: unknown,
) {
  const existing =
    existingNode && typeof existingNode === 'object' && !Array.isArray(existingNode)
      ? (existingNode as Record<string, unknown>)
      : {};
  const result =
    pendingResult && typeof pendingResult === 'object' && !Array.isArray(pendingResult)
      ? (normalizePendingRewardsEstimateResult(pendingResult) as Record<string, unknown>)
      : {};
  const loadedAllRoles =
    readPendingRewardsAllRoles(loadedMethodNode) ??
    readPendingRewardsAllRoles(result) ??
    readPendingRewardsAllRoles(pendingResult) ??
    readPendingRewardsAllRoles(existing);
  const loadedMethodRole = resolveSpCoinMethodRole(loadedMethod);
  const foundRoleState = readFirstRoleState(loadedMethodNode, result, pendingResult, existing);
  const roleState =
    loadedMethodRole && (!foundRoleState?.known || foundRoleState.roles.length === 0)
      ? buildRoleState([loadedMethodRole as PendingRewardsRoleName])
      : foundRoleState;
  const getMethodNode = (method: string) =>
    PENDING_REWARDS_ESTIMATE_METHODS.has(method)
      ? mergeMethodResultAmount(
          loadedMethod === method
            ? loadedMethodNode
            : existing[method] ?? buildLazyPendingRewardsMethod(normalizedAccount, method),
          (loadedMethod === method
            ? readPendingRewardsMethodAmount(loadedMethodNode, method)
            : null) ??
            readPendingRewardsAllRolesAmount(loadedAllRoles, method) ??
            readPendingRewardsMethodAmount(
              loadedMethod === method ? loadedMethodNode : existing[method],
              method,
            ),
          method,
          normalizedAccount,
          loadedAllRoles,
        )
      : loadedMethod === method
        ? loadedMethodNode
        : existing[method] ?? buildLazyPendingRewardsMethod(normalizedAccount, method);
  const suppressMethodInjection = existing.__suppressPendingRewardsMethodInjection === true;
  if (suppressMethodInjection) {
    return prunePendingRewardsRoleMethods({
      ...existing,
      TYPE: existing.TYPE ?? '--PENDING_REWARDS--',
      [loadedMethod]: loadedMethodNode,
      meta: withPendingRewardsRoleMeta(existing.meta, loadedMethod, loadedMethodNode),
      pendingRewards: String(result.pendingRewards ?? existing.pendingRewards ?? '0'),
      __pendingRewardsRefreshAction: true,
      __pendingRewardsRefreshAtMs: refreshAtMs,
      __pendingRewardsRefreshActionName: action,
      __suppressPendingRewardsMethodInjection: true,
    }, roleState);
  }
  const estimateOffChainTotalRewards = getMethodNode('estimateOffChainTotalRewards');
  const claimOnChainTotalRewards = getMethodNode('claimOnChainTotalRewards');
  const estimateOffChainSponsorRewards = getMethodNode('estimateOffChainSponsorRewards');
  const claimOnChainSponsorRewards = getMethodNode('claimOnChainSponsorRewards');
  const estimateOffChainRecipientRewards = getMethodNode('estimateOffChainRecipientRewards');
  const claimOnChainRecipientRewards = getMethodNode('claimOnChainRecipientRewards');
  const estimateOffChainAgentRewards = getMethodNode('estimateOffChainAgentRewards');
  const claimOnChainAgentRewards = getMethodNode('claimOnChainAgentRewards');
  return prunePendingRewardsRoleMethods({
    ...existing,
    TYPE: existing.TYPE ?? '--PENDING_REWARDS--',
    ...(shouldIncludePendingRewardsMethod('estimateOffChainTotalRewards', roleState) ? { estimateOffChainTotalRewards } : {}),
    ...(shouldIncludePendingRewardsMethod('claimOnChainTotalRewards', roleState) ? { claimOnChainTotalRewards } : {}),
    ...(shouldIncludePendingRewardsMethod('estimateOffChainSponsorRewards', roleState) ? { estimateOffChainSponsorRewards } : {}),
    ...(shouldIncludePendingRewardsMethod('claimOnChainSponsorRewards', roleState) ? { claimOnChainSponsorRewards } : {}),
    ...(shouldIncludePendingRewardsMethod('estimateOffChainRecipientRewards', roleState) ? { estimateOffChainRecipientRewards } : {}),
    ...(shouldIncludePendingRewardsMethod('claimOnChainRecipientRewards', roleState) ? { claimOnChainRecipientRewards } : {}),
    ...(shouldIncludePendingRewardsMethod('estimateOffChainAgentRewards', roleState) ? { estimateOffChainAgentRewards } : {}),
    ...(shouldIncludePendingRewardsMethod('claimOnChainAgentRewards', roleState) ? { claimOnChainAgentRewards } : {}),
    meta: withPendingRewardsRoleMeta(existing.meta, loadedMethod, loadedMethodNode),
    pendingRewards: String(result.pendingRewards ?? existing.pendingRewards ?? '0'),
    __pendingRewardsRefreshAction: true,
    __pendingRewardsRefreshAtMs: refreshAtMs,
    __pendingRewardsRefreshActionName: action,
  }, roleState);
}

export function toRewardsBigInt(value: unknown) {
  const normalized = String(value ?? '0').replace(/,/g, '').trim();
  if (!normalized) return 0n;
  try {
    return BigInt(normalized);
  } catch {
    return 0n;
  }
}

function readAccountRecordKey(value: unknown) {
  const record = asRecord(value);
  return normalizeAccountKeyValue(record?.accountKey);
}

function isAccountRecordNode(value: unknown) {
  const record = asRecord(value);
  if (!record) return false;
  if (record.TYPE === '--ACCOUNT--') return true;
  if (record.TYPE) return false;
  return Boolean(
    record.role !== undefined ||
      record.rewardsEarned !== undefined ||
      record.sponsorCount !== undefined ||
      record.recipientCount !== undefined ||
      record.agentCount !== undefined,
  );
}

function getClaimRewardsRecord(value: unknown): Record<string, unknown> | null {
  const entries = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && !Array.isArray(value) && Array.isArray((value as Record<string, unknown>).receipts)
      ? ((value as Record<string, unknown>).receipts as unknown[])
      : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    if (record.claimedAmount !== undefined) return record;
  }
  return null;
}

export function buildClaimedRewardsSummary(updateResult: unknown, fallback?: {
  claimedAmount?: string;
}) {
  const rewardsRecord = getClaimRewardsRecord(updateResult);
  const claimedAmount = toDisplayString(rewardsRecord?.claimedAmount ?? fallback?.claimedAmount, '0');
  return {
    claimedAmount,
    totalRewardsClaimed: claimedAmount,
    ...(rewardsRecord?.__claimedRewardsByAccount ? { __claimedRewardsByAccount: rewardsRecord.__claimedRewardsByAccount } : {}),
    ...(rewardsRecord?.__claimedRewardsAllRoles ? { __claimedRewardsAllRoles: rewardsRecord.__claimedRewardsAllRoles } : {}),
  };
}
