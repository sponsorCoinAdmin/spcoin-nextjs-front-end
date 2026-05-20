import {
  calculateFormattedDT,
  normalizePendingRewardsDisplayResult,
} from '@/lib/spCoinLab/pendingRewards';

function toDisplayString(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
}

export type PendingRewardsActionClick = {
  accountKey: string;
  action: 'claim' | 'estimate';
  method?:
    | 'estimateOffChainTotalRewards'
    | 'estimateOffChainSponsorRewards'
    | 'estimateOffChainRecipientRewards'
    | 'estimateOffChainAgentRewards'
    | 'claimOnChainTotalRewards'
    | 'claimOnChainSponsorRewards'
    | 'claimOnChainRecipientRewards'
    | 'claimOnChainAgentRewards';
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
  const record = normalized as Record<string, unknown>;
  const amount =
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
    if (value !== undefined && value !== null) return String(value);
  }
  return readPendingRewardsAmount(record);
}

function mergeMethodResultAmount(methodNode: unknown, amount: string | null, method: string) {
  if (amount === null || !isLoadedPendingRewardsMethodNode(methodNode)) return methodNode;
  const record = asRecord(methodNode);
  const result = asRecord(record?.result);
  if (!record || !result) return methodNode;

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

  return {
    ...record,
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

  for (const method of PENDING_REWARDS_METHOD_KEYS) {
    const methodName = String(method);
    const candidate =
      loadedMethod === methodName
        ? loadedMethodNode
        : isLoadedPendingRewardsMethodNode(existing[method])
          ? existing[method]
          : refreshed[method] ?? existing[method] ?? buildLazyPendingRewardsMethod(normalizedAccount, methodName);

    next[method] = PENDING_REWARDS_ESTIMATE_METHODS.has(methodName)
      ? mergeMethodResultAmount(
          candidate,
          readPendingRewardsMethodAmount(candidate, methodName) ??
            readPendingRewardsMethodAmount(existing, methodName) ??
            readPendingRewardsMethodAmount(refreshed, methodName),
          methodName,
        )
      : candidate;
  }

  next.pendingRewards = String(existing.pendingRewards ?? refreshed.pendingRewards ?? '0');
  next.__pendingRewardsRefreshAction = true;
  next.__pendingRewardsRefreshAtMs = refreshAtMs;
  next.__pendingRewardsRefreshActionName = action;
  return next;
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
  const getMethodNode = (method: string) =>
    loadedMethod === method
      ? loadedMethodNode
      : existing[method] ?? buildLazyPendingRewardsMethod(normalizedAccount, method);
  const estimateOffChainTotalRewards = getMethodNode('estimateOffChainTotalRewards');
  const claimOnChainTotalRewards = getMethodNode('claimOnChainTotalRewards');
  const estimateOffChainSponsorRewards = getMethodNode('estimateOffChainSponsorRewards');
  const claimOnChainSponsorRewards = getMethodNode('claimOnChainSponsorRewards');
  const estimateOffChainRecipientRewards = getMethodNode('estimateOffChainRecipientRewards');
  const claimOnChainRecipientRewards = getMethodNode('claimOnChainRecipientRewards');
  const estimateOffChainAgentRewards = getMethodNode('estimateOffChainAgentRewards');
  const claimOnChainAgentRewards = getMethodNode('claimOnChainAgentRewards');
  return {
    ...existing,
    TYPE: existing.TYPE ?? '--PENDING_REWARDS--',
    estimateOffChainTotalRewards,
    claimOnChainTotalRewards,
    estimateOffChainSponsorRewards,
    claimOnChainSponsorRewards,
    estimateOffChainRecipientRewards,
    claimOnChainRecipientRewards,
    estimateOffChainAgentRewards,
    claimOnChainAgentRewards,
    pendingRewards: String(result.pendingRewards ?? existing.pendingRewards ?? '0'),
    __pendingRewardsRefreshAction: true,
    __pendingRewardsRefreshAtMs: refreshAtMs,
    __pendingRewardsRefreshActionName: action,
  };
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

export function readAccountRecordBalanceOf(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const totalSpCoins = record.totalSpCoins;
  if (totalSpCoins && typeof totalSpCoins === 'object' && !Array.isArray(totalSpCoins)) {
    const balance = (totalSpCoins as Record<string, unknown>).balanceOf;
    if (balance !== undefined && balance !== null) return String(balance);
  }
  const balance = record.balanceOf ?? record.accountBalance;
  return balance === undefined || balance === null ? null : String(balance);
}

function readAccountRecordTimestamp(value: unknown, timestampKey: string, pendingRewardsKey: string): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const direct = record[timestampKey];
  if (direct !== undefined && direct !== null) return String(direct);
  const totalSpCoins = record.totalSpCoins;
  const pendingRewards =
    totalSpCoins && typeof totalSpCoins === 'object' && !Array.isArray(totalSpCoins)
      ? (totalSpCoins as Record<string, unknown>).pendingRewards
      : null;
  if (pendingRewards && typeof pendingRewards === 'object' && !Array.isArray(pendingRewards)) {
    const nested = (pendingRewards as Record<string, unknown>)[pendingRewardsKey];
    if (nested !== undefined && nested !== null) return String(nested);
  }
  return null;
}

export function buildAccountRecordMetaPatch(value: unknown): Record<string, unknown> {
  const lastSponsorUpdateTimeStamp = readAccountRecordTimestamp(value, 'lastSponsorUpdateTimeStamp', 'lastSponsorUpdate');
  const lastRecipientUpdateTimeStamp = readAccountRecordTimestamp(value, 'lastRecipientUpdateTimeStamp', 'lastRecipientUpdate');
  const lastAgentUpdateTimeStamp = readAccountRecordTimestamp(value, 'lastAgentUpdateTimeStamp', 'lastAgentUpdate');
  return {
    ...(lastSponsorUpdateTimeStamp ? { lastSponsorUpdateTimeStamp: calculateFormattedDT(lastSponsorUpdateTimeStamp) } : {}),
    ...(lastRecipientUpdateTimeStamp ? { lastRecipientUpdateTimeStamp: calculateFormattedDT(lastRecipientUpdateTimeStamp) } : {}),
    ...(lastAgentUpdateTimeStamp ? { lastAgentUpdateTimeStamp: calculateFormattedDT(lastAgentUpdateTimeStamp) } : {}),
  };
}

export function readRefreshedAccountRecordFromClaim(value: unknown): unknown | null {
  const visit = (entry: unknown): unknown | null => {
    if (!entry || typeof entry !== 'object') return null;
    if (Array.isArray(entry)) {
      for (const item of entry) {
        const found = visit(item);
        if (found) return found;
      }
      return null;
    }
    const record = entry as Record<string, unknown>;
    if (record.refreshedAccountRecord) return record.refreshedAccountRecord;
    if (record.result) {
      const found = visit(record.result);
      if (found) return found;
    }
    if (record.receipts) {
      const found = visit(record.receipts);
      if (found) return found;
    }
    return null;
  };
  return visit(value);
}

function getClaimBalanceRecord(value: unknown): Record<string, unknown> | null {
  const entries = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && !Array.isArray(value) && Array.isArray((value as Record<string, unknown>).receipts)
      ? ((value as Record<string, unknown>).receipts as unknown[])
      : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    if (record.claimedAmount !== undefined || (record.balanceBefore !== undefined && record.balanceAfter !== undefined)) return record;
  }
  return null;
}

export function buildClaimedBalanceSummary(updateResult: unknown, fallback?: {
  balanceBefore?: string;
  balanceAfter?: string;
  claimedAmount?: string;
}) {
  const balanceRecord = getClaimBalanceRecord(updateResult);
  const balanceBefore = String(balanceRecord?.balanceBefore ?? fallback?.balanceBefore ?? '0');
  const balanceAfter = String(balanceRecord?.balanceAfter ?? fallback?.balanceAfter ?? '0');
  const claimedAmount = String(
    balanceRecord?.claimedAmount ??
      fallback?.claimedAmount ??
      (toRewardsBigInt(balanceAfter) - toRewardsBigInt(balanceBefore)).toString(),
  );
  return {
    balanceBefore,
    balanceAfter,
    claimedAmount,
    totalRewardsClaimed: claimedAmount,
  };
}
