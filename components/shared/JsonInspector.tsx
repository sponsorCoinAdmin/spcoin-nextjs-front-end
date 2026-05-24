'use client';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import React, { useCallback, useState } from 'react';
import {
  calculateFormattedDT,
  normalizePendingRewardsDisplayResult,
} from '@/lib/spCoinLab/pendingRewards';

const PENDING_REWARDS_REFRESH_MS = 10_000;
const PENDING_REWARDS_METHOD_NAMES = new Set([
  'estimateOffChainTotalRewards',
  'claimOnChainTotalRewards',
  'estimateOffChainSponsorRewards',
  'claimOnChainSponsorRewards',
  'estimateOffChainRecipientRewards',
  'claimOnChainRecipientRewards',
  'estimateOffChainAgentRewards',
  'claimOnChainAgentRewards',
]);

const PENDING_REWARDS_ESTIMATE_METHOD_NAMES = new Set(
  [...PENDING_REWARDS_METHOD_NAMES].filter((methodName) => methodName.startsWith('estimateOffChain')),
);
const PENDING_REWARDS_CLAIM_METHOD_NAMES = new Set(
  [...PENDING_REWARDS_METHOD_NAMES].filter((methodName) => methodName.startsWith('claimOnChain')),
);

const PENDING_REWARDS_METHOD_DISPLAY_NAMES: Record<string, string> = {
  estimateOffChainTotalRewards: 'estimateOffChainTotalRewards',
  claimOnChainTotalRewards: 'claimOnChainTotalRewards',
  estimateOffChainSponsorRewards: 'estimateOffChainSponsorRewards',
  claimOnChainSponsorRewards: 'claimOnChainSponsorRewards',
  estimateOffChainRecipientRewards: 'estimateOffChainRecipientRewards',
  claimOnChainRecipientRewards: 'claimOnChainRecipientRewards',
  estimateOffChainAgentRewards: 'estimateOffChainAgentRewards',
  claimOnChainAgentRewards: 'claimOnChainAgentRewards',
};

type DisplayAccountRole = 'Sponsor' | 'Recipient' | 'Agent';

type RoleSingleSource = {
  role: DisplayAccountRole | '';
  isSponsor: boolean;
  isRecipient: boolean;
  isAgent: boolean;
};

function toDisplayBigInt(value: unknown): bigint {
  const normalized = String(value ?? '0').replace(/,/g, '').trim();
  if (!normalized) return 0n;
  try {
    return BigInt(normalized);
  } catch {
    return 0n;
  }
}

function calculateDisplayTimeDiffSeconds(startValue: unknown, endValue: unknown): string {
  const start = toDisplayBigInt(startValue);
  const end = toDisplayBigInt(endValue);
  if (start <= 0n || end <= start) return '0';
  return (end - start).toString();
}

function formatDisplayTimeDiffSeconds(value: unknown): string {
  let remainingMs = toDisplayBigInt(value) * 1000n;
  if (remainingMs <= 0n) return '0';
  const msPerSecond = 1000n;
  const msPerMinute = 60n * msPerSecond;
  const msPerHour = 60n * msPerMinute;
  const msPerDay = 24n * msPerHour;
  const days = remainingMs / msPerDay;
  remainingMs %= msPerDay;
  const hours = remainingMs / msPerHour;
  remainingMs %= msPerHour;
  const mins = remainingMs / msPerMinute;
  remainingMs %= msPerMinute;
  const secs = remainingMs / msPerSecond;
  const ms = remainingMs % msPerSecond;
  const parts: string[] = [];
  if (days > 0n) parts.push(`Days = ${days.toString()}`);
  if (hours > 0n) parts.push(`Hours = ${hours.toString()}`);
  if (mins > 0n) parts.push(`Mins = ${mins.toString()}`);
  if (secs > 0n) parts.push(`Secs = ${secs.toString()}`);
  if (ms > 0n) parts.push(`MS = ${ms.toString()}`);
  return parts.join(' ');
}

function getRoleSingleSource(counts: AccountRoleCounts | null | undefined): RoleSingleSource {
  if (!counts) {
    return {
      role: '',
      isSponsor: false,
      isRecipient: false,
      isAgent: false,
    };
  }
  const isSponsor = counts.isSponsor ?? counts.recipientCount > 0;
  const isRecipient = counts.isRecipient ?? (counts.sponsorCount > 0 || counts.agentCount > 0);
  const isAgent = counts.isAgent ?? counts.parentRecipientCount > 0;
  const role = isAgent ? 'Agent' : isRecipient ? 'Recipient' : isSponsor ? 'Sponsor' : '';
  return {
    role,
    isSponsor,
    isRecipient,
    isAgent,
  };
}

function normalizeRewardFormulsValuesDisplayShape(
  value: Record<string, unknown>,
  roleValue?: unknown,
): Record<string, unknown> {
  const next = { ...value };
  const normalizedRole = String(roleValue ?? '').trim();
  if (normalizedRole) {
    next.role = normalizedRole;
  }
  if (
    Object.prototype.hasOwnProperty.call(next, 'bucketLastUpdateTimeStamp') &&
    !Object.prototype.hasOwnProperty.call(next, 'sponsorBucketLastUpdateTimeStamp')
  ) {
    next.sponsorBucketLastUpdateTimeStamp = next.bucketLastUpdateTimeStamp;
  }
  if (
    Object.prototype.hasOwnProperty.call(next, 'bucketLastUpdateFormatted') &&
    !Object.prototype.hasOwnProperty.call(next, 'sponsorBucketLastUpdateFormatted')
  ) {
    next.sponsorBucketLastUpdateFormatted = next.bucketLastUpdateFormatted;
  }

  delete next.bucketLastUpdateTimeStamp;
  delete next.bucketLastUpdateFormatted;
  delete next.lastSponsorUpdate;
  delete next.lastRecipientUpdate;
  delete next.lastAgentUpdate;
  delete next.lastSponsorTimeStamp;
  delete next.lastRecipientTimeStamp;
  delete next.lastAgentTimeStamp;
  delete next.timeDifference;
  delete next.timeDifferenceMS;
  delete next.formattedDifference;
  delete next.pendingRewards;
  delete next.secondsInYesr;
  delete next.yearSeconds;
  delete next.rateUnit;
  delete next.pendingRoleRewards;
  delete next.totalRewards;

  const bucketTimestamp =
    next.sponsorBucketLastUpdateTimeStamp ??
    next.recipientBucketLastUpdateTimeStamp ??
    next.agentBucketLastUpdateTimeStamp;
  if (
    bucketTimestamp !== undefined &&
    next.calculatedTimeStamp !== undefined &&
    !Object.prototype.hasOwnProperty.call(next, 'calculatedTimeDiff')
  ) {
    next.calculatedTimeDiff = calculateDisplayTimeDiffSeconds(bucketTimestamp, next.calculatedTimeStamp);
  }
  if (
    next.calculatedTimeDiff !== undefined &&
    !Object.prototype.hasOwnProperty.call(next, 'TimeDiffFormatted')
  ) {
    next.TimeDiffFormatted = formatDisplayTimeDiffSeconds(next.calculatedTimeDiff);
  }

  if (normalizedRole === 'Sponsor') {
    delete next.pendingRecipientRewards;
    delete next.pendingAgentRewards;
  } else if (normalizedRole === 'Recipient') {
    delete next.pendingSponsorRewards;
    delete next.pendingAgentRewards;
  } else if (normalizedRole === 'Agent') {
    delete next.pendingSponsorRewards;
    delete next.pendingRecipientRewards;
  } else {
    const hasSponsorBucket = Object.prototype.hasOwnProperty.call(next, 'sponsorBucketLastUpdateTimeStamp');
    const hasRecipientBucket = Object.prototype.hasOwnProperty.call(next, 'recipientBucketLastUpdateTimeStamp');
    const hasAgentBucket = Object.prototype.hasOwnProperty.call(next, 'agentBucketLastUpdateTimeStamp');
    if (!hasSponsorBucket) delete next.pendingSponsorRewards;
    if (!hasRecipientBucket) delete next.pendingRecipientRewards;
    if (!hasAgentBucket) delete next.pendingAgentRewards;
  }

  const normalizeRoleSnapshotFields = (snapshotValue: unknown) => {
    if (!snapshotValue || typeof snapshotValue !== 'object' || Array.isArray(snapshotValue)) return snapshotValue;
    if (!['Sponsor', 'Recipient', 'Agent'].includes(normalizedRole)) return snapshotValue;
    const snapshot = { ...(snapshotValue as Record<string, unknown>) };
    const rewardsKey = `account${normalizedRole}Rewards`;
    const updateKey = `account${normalizedRole}UpdateTimeStamp`;
    if (
      Object.prototype.hasOwnProperty.call(snapshot, 'accountRoleRewards') &&
      !Object.prototype.hasOwnProperty.call(snapshot, rewardsKey)
    ) {
      snapshot[rewardsKey] = snapshot.accountRoleRewards;
    }
    if (
      Object.prototype.hasOwnProperty.call(snapshot, 'accountRoleUpdateTimeStamp') &&
      !Object.prototype.hasOwnProperty.call(snapshot, updateKey)
    ) {
      snapshot[updateKey] = snapshot.accountRoleUpdateTimeStamp;
    }
    delete snapshot.accountRoleRewards;
    delete snapshot.accountRoleUpdateTimeStamp;
    return snapshot;
  };
  next.accountSnapshotBefore = normalizeRoleSnapshotFields(next.accountSnapshotBefore);
  next.accountSnapshotAfter = normalizeRoleSnapshotFields(next.accountSnapshotAfter);
  if (
    normalizedRole &&
    next.accountSnapshotBefore &&
    typeof next.accountSnapshotBefore === 'object' &&
    !Array.isArray(next.accountSnapshotBefore) &&
    !Object.prototype.hasOwnProperty.call(next, 'previousUpdateSeconds')
  ) {
    const snapshotBefore = next.accountSnapshotBefore as Record<string, unknown>;
    const roleUpdateKey = `account${normalizedRole}UpdateTimeStamp`;
    const previousUpdateTimeStamp = snapshotBefore[roleUpdateKey] ?? snapshotBefore.accountRoleUpdateTimeStamp;
    if (previousUpdateTimeStamp !== undefined) {
      next.previousUpdateSeconds = previousUpdateTimeStamp;
      if (!Object.prototype.hasOwnProperty.call(next, 'previousFormattedTimeStamp')) {
        next.previousFormattedTimeStamp = formatTimestampDateDisplay(previousUpdateTimeStamp);
      }
    }
  }
  if (
    normalizedRole &&
    Object.prototype.hasOwnProperty.call(next, 'settlementTimestamp')
  ) {
    const lastUpdateSecondsKey = `last${normalizedRole}UpdateSeconds`;
    const lastUpdateTimeStampKey = `last${normalizedRole}UpdateTimeStamp`;
    if (!Object.prototype.hasOwnProperty.call(next, lastUpdateSecondsKey)) {
      next[lastUpdateSecondsKey] = next.settlementTimestamp;
    }
    if (!Object.prototype.hasOwnProperty.call(next, lastUpdateTimeStampKey)) {
      next[lastUpdateTimeStampKey] = formatTimestampDateDisplay(next.settlementTimestamp);
    }
    delete next.settlementTimestamp;
    delete next.formattedSettlementTimestamp;
  }

  const orderedKeys = [
    'Note',
    'note',
    'role',
    'solidityMethod',
    'soliditySource',
    'sponsorBucketLastUpdateTimeStamp',
    'recipientBucketLastUpdateTimeStamp',
    'agentBucketLastUpdateTimeStamp',
    'calculatedTimeStamp',
    'calculatedTimeDiff',
    'TimeDiffFormatted',
    'sponsorBucketLastUpdateFormatted',
    'recipientBucketLastUpdateFormatted',
    'agentBucketLastUpdateFormatted',
    'calculatedFormatted',
    'pendingSponsorRewards',
    'pendingRecipientRewards',
    'pendingAgentRewards',
    'pendingTotalRewards',
    'exactClaimedAmountFormula',
    'exactClaimedAmountSource',
    'balanceBefore',
    'balanceAfter',
    'claimedAmount',
    'previousUpdateSeconds',
    'previousFormattedTimeStamp',
    'lastSponsorUpdateSeconds',
    'lastSponsorUpdateTimeStamp',
    'lastRecipientUpdateSeconds',
    'lastRecipientUpdateTimeStamp',
    'lastAgentUpdateSeconds',
    'lastAgentUpdateTimeStamp',
    'settlementTimestamp',
    'formattedSettlementTimestamp',
    'accountSnapshotBefore',
    'accountSnapshotAfter',
  ];
  const ordered: Record<string, unknown> = {};
  for (const key of orderedKeys) {
    if (Object.prototype.hasOwnProperty.call(next, key)) ordered[key] = next[key];
  }
  for (const [key, entry] of Object.entries(next)) {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) ordered[key] = entry;
  }
  return ordered;
}

function getPendingRewardsMethodDisplayName(methodName: string): string {
  return PENDING_REWARDS_METHOD_DISPLAY_NAMES[methodName] || methodName;
}

function readCallParameterValue(callRecord: Record<string, unknown> | null, keys: string[]): string {
  const parameters = callRecord?.parameters;
  if (Array.isArray(parameters)) {
    for (const key of keys) {
      const match = parameters.find((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
        const record = entry as Record<string, unknown>;
        return String(record.label ?? record.key ?? '').trim() === key;
      });
      if (match && typeof match === 'object' && !Array.isArray(match)) {
        const value = (match as Record<string, unknown>).value;
        if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
      }
    }
    return '';
  }
  if (!parameters || typeof parameters !== 'object') return '';
  const record = parameters as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function getMethodDisplayParameterValue(methodName: string, callRecord: Record<string, unknown> | null): string {
  const parameterKeys: Record<string, string[]> = {
    getAccountRecord: ['Account Key', 'Account'],
    addRecipientTransaction: ['Recipient Key', 'Recipient'],
    addAgentTransaction: ['Agent Key', 'Agent'],
    estimateOffChainSponsorRewards: ['Account Key', 'Account'],
    estimateOffChainRecipientRewards: ['Account Key', 'Account'],
  };
  return readCallParameterValue(callRecord, parameterKeys[methodName] ?? ['Account Key', 'Account']);
}

function isAddressText(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(String(value || '').trim());
}

interface JsonInspectorProps {
  data: any;
  collapsedKeys: string[];
  updateCollapsedKeys: (next: string[]) => void;
  level?: number;
  path?: string;
  rootLabel?: string;
  label?: string;
  highlightPathPrefixes?: string[];
  highlightColorClass?: string;
  showAll?: boolean;
  hiddenRules?: {
    zeroValues: boolean;
    emptyValues: boolean;
    falseValues: boolean;
    todoValues: boolean;
    emptyCollections: boolean;
    creationDates: boolean;
    formattedAmounts: boolean;
  };
  onLeafValueClick?: (value: string, path: string, key: string) => void;
  onAddressNodeClick?: (value: string, path: string, key: string) => void;
  onTrace?: (line: string) => void;
  hideEntryKeys?: string[];
  forceShowEntryKeys?: string[];
  formatTokenAmounts?: boolean;
  tokenDecimals?: number | null;
  showStructureType?: boolean;
  accountRoleCounts?: AccountRoleCounts | null;
  scriptStepDragState?: {
    enabled: boolean;
    draggedStepNumber: number | null;
    dropTarget: { stepNumber: number; placement: 'before' | 'after' } | null;
    setDraggedStepNumber: (value: number | null) => void;
    setDropTarget: (value: { stepNumber: number; placement: 'before' | 'after' } | null) => void;
    beginDrag: (stepNumber: number) => void;
    onStepDoubleClick?: (stepNumber: number, methodName: string) => void;
    onStepMethodClick?: (stepNumber: number, methodName: string) => void;
  };
}

type AccountRoleCounts = {
  sponsorCount: number;
  recipientCount: number;
  agentCount: number;
  parentRecipientCount: number;
  isSponsor?: boolean;
  isRecipient?: boolean;
  isAgent?: boolean;
};

function parseCountValue(value: unknown): number {
  const normalized = String(value ?? '0').replace(/,/g, '').trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseBooleanValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return undefined;
}

function getAccountRoleCounts(data: any): AccountRoleCounts | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  const hasCount =
    Object.prototype.hasOwnProperty.call(record, 'sponsorCount') ||
    Object.prototype.hasOwnProperty.call(record, 'recipientCount') ||
    Object.prototype.hasOwnProperty.call(record, 'agentCount') ||
    Object.prototype.hasOwnProperty.call(record, 'parentRecipientCount');
  const hasRoleFlag =
    Object.prototype.hasOwnProperty.call(record, 'isSponsor') ||
    Object.prototype.hasOwnProperty.call(record, 'isRecipient') ||
    Object.prototype.hasOwnProperty.call(record, 'isRecipiet') ||
    Object.prototype.hasOwnProperty.call(record, 'isAgent');
  if (!hasCount && !hasRoleFlag) return null;
  return {
    sponsorCount: parseCountValue(record.sponsorCount),
    recipientCount: parseCountValue(record.recipientCount),
    agentCount: parseCountValue(record.agentCount),
    parentRecipientCount: parseCountValue(record.parentRecipientCount),
    isSponsor: parseBooleanValue(record.isSponsor),
    isRecipient: parseBooleanValue(record.isRecipient ?? record.isRecipiet),
    isAgent: parseBooleanValue(record.isAgent),
  };
}

function hasRoleCountForPendingRewardsKey(key: string, counts: AccountRoleCounts | null | undefined): boolean {
  const normalizedKey = String(key || '').trim();
  if (/^update.*AccountRewards$/.test(normalizedKey) || /^get.*PendingRewards$/.test(normalizedKey)) {
    return false;
  }
  if (!counts) return true;
  const roleSource = getRoleSingleSource(counts);
  if (/SponsorRewards$/.test(normalizedKey) || normalizedKey === 'pendingSponsorRewards') {
    return roleSource.isSponsor;
  }
  if (/RecipientRewards$/.test(normalizedKey) || normalizedKey === 'pendingRecipientRewards') {
    return roleSource.isRecipient;
  }
  if (/AgentRewards$/.test(normalizedKey) || normalizedKey === 'pendingAgentRewards') {
    return roleSource.isAgent;
  }
  return true;
}

function getScriptStepNumberFromLabel(label: string): number | null {
  const normalized = String(label || '').trim();
  const match = normalized.match(/(?:^|[^a-zA-Z])(step|script)-(\d+)(?::|$)/i);
  if (!match) return null;
  const parsed = Number(match[2]);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed + 1 : null;
}

function getScriptStepNumberFromExactSegment(value: string): number | null {
  const normalized = String(value || '').trim();
  const match = normalized.match(/^(step|script)-(\d+)$/i);
  if (!match) return null;
  const parsed = Number(match[2]);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed + 1 : null;
}

function isScriptStepDisplayLabel(value: string): boolean {
  return /^(?:Step|Script)\s+\d+(?::)?$/i.test(String(value || '').trim());
}

function getAddressNodeLabel(data: any, fallbackLabel: string): string {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return fallbackLabel;
  if (isScriptStepDisplayLabel(fallbackLabel)) return fallbackLabel;
  if (data.call && typeof data.call === 'object' && !Array.isArray(data.call)) return fallbackLabel;
  const address = typeof data.address === 'string' ? data.address.trim() : '';
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) return `${fallbackLabel}: "${address}"`;
  const accountKey = typeof data.accountKey === 'string' ? data.accountKey.trim() : '';
  if (!/^0x[0-9a-fA-F]{40}$/.test(accountKey)) return fallbackLabel;
  return `${fallbackLabel}: "${accountKey}"`;
}

function hasInlineAccountRecord(data: any): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const record = data as Record<string, unknown>;
  if (record.accountRecord && typeof record.accountRecord === 'object' && record.accountRecord !== null) {
    return true;
  }
  return Boolean(
    typeof record.TYPE === 'string' ||
      record.totalSpCoins ||
      record.recipientKeys ||
      record.agentKeys ||
      record.parentRecipientKeys,
  );
}

function isLazySpCoinMetaDataNode(data: any): boolean {
  return Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      (data as Record<string, unknown>).__lazySpCoinMetaData === true,
  );
}

function isLazyMasterAccountKeysNode(data: any): boolean {
  return Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      (data as Record<string, unknown>).__lazyMasterAccountKeys === true,
  );
}

function isLazyAccountRelationNode(data: any): boolean {
  return Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      (data as Record<string, unknown>).__lazyAccountRelation === true,
  );
}

function getLazyAccountRelationCount(data: any): number {
  if (!isLazyAccountRelationNode(data)) return 0;
  const count = Number((data as Record<string, unknown>).count ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function getLazyAccountRelationName(data: any, fallback: string): string {
  if (!isLazyAccountRelationNode(data)) return fallback;
  const relation = String((data as Record<string, unknown>).relation || fallback).trim();
  const count = Number((data as Record<string, unknown>).count ?? 0);
  const displayCount = Number.isFinite(count) && count >= 0 ? count : 0;
  const baseRelation = relation.endsWith('[]') ? relation.slice(0, -2) : relation;
  return `${baseRelation}[${displayCount}]`;
}

function getAccountRelationMethodLabel(method: string): string {
  const normalizedMethod = String(method || '').trim();
  if (normalizedMethod === 'getSponsorKeys') return 'sponsorKeys';
  if (normalizedMethod === 'getRecipientKeys') return 'recipientKeys';
  if (normalizedMethod === 'getAgentKeys') return 'agentKeys';
  if (normalizedMethod === 'getParentRecipientKeys') return 'parentRecipientKeys';
  return '';
}

function isTotalSpCoinsRecord(data: any): boolean {
  return Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      ((data as Record<string, unknown>).TYPE === '--TOTAL_SP_COINS--' ||
        Object.prototype.hasOwnProperty.call(data, 'totalSpCoins')),
  );
}

function isPendingRewardsRecord(data: any): boolean {
  const record =
    data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  if (!record || isTotalSpCoinsRecord(record)) return false;
  const hasPendingRewardsValue = Object.prototype.hasOwnProperty.call(record, 'pendingRewards');
  const hasPendingRewardsAction =
    Object.prototype.hasOwnProperty.call(record, 'claim') ||
    Object.prototype.hasOwnProperty.call(record, 'estimate') ||
    Object.prototype.hasOwnProperty.call(record, 'mode');
  const hasPendingRewardsTotals =
    Object.prototype.hasOwnProperty.call(record, 'stakingRewards') ||
    Object.prototype.hasOwnProperty.call(record, 'lastSponsorUpdate') ||
    Object.prototype.hasOwnProperty.call(record, 'lastSponsorUpdateTimeStamp') ||
    Object.prototype.hasOwnProperty.call(record, 'lastRecipientUpdate') ||
    Object.prototype.hasOwnProperty.call(record, 'lastRecipientUpdateTimeStamp') ||
    Object.prototype.hasOwnProperty.call(record, 'lastAgentUpdate') ||
    Object.prototype.hasOwnProperty.call(record, 'lastAgentUpdateTimeStamp');
  const hasPendingRewardsShape = Boolean(
    record &&
      (record.TYPE === '--PENDING_REWARDS--' ||
        record.TYPE === '--ACCOUNT_PENDING_REWARDS--' ||
        (hasPendingRewardsAction && (hasPendingRewardsValue || hasPendingRewardsTotals))),
  );
  return Boolean(
    record &&
      hasPendingRewardsShape,
  );
}

function isZeroPendingRewardsPlaceholderLabel(label: string, data: any): boolean {
  if (label !== 'pendingRewards' || !isPendingRewardsRecord(data)) return false;
  const record = data as Record<string, unknown>;
  const amount = String(record.pendingRewards ?? '').replace(/,/g, '').trim();
  if (amount !== '0') return false;
  return [...PENDING_REWARDS_METHOD_NAMES].some((methodName) => Object.prototype.hasOwnProperty.call(record, methodName));
}

function isTotalSpCoinsPendingRewards(parent: any, childKey: string, childValue: any): boolean {
  return childKey === 'pendingRewards' && isTotalSpCoinsRecord(parent) && isPendingRewardsRecord(childValue);
}

function isPendingRewardsIncludedMethodNode(data: any): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const record = data as Record<string, unknown>;
  if (record.call !== undefined || record.result !== undefined || record.meta !== undefined) return false;
  return record.__pendingRewardsIncludedMethod === true || record.__lazyPendingRewardsMethod === true;
}

function getTotalSpCoinsPendingRewardsAction(_data: any): Record<string, unknown> | null {
  return null;
}

function getPendingRewardsRefreshAtMs(data: any): number {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 0;
  const record = data as Record<string, unknown>;
  const refreshAt = Number(record.__pendingRewardsRefreshAtMs ?? 0);
  if (Number.isFinite(refreshAt) && refreshAt > 0) return refreshAt;
  const estimate = record.estimate;
  if (estimate && typeof estimate === 'object' && !Array.isArray(estimate)) {
    const result = (estimate as Record<string, unknown>).result;
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      const nestedRefreshAt = Number((result as Record<string, unknown>).__pendingRewardsRefreshAtMs ?? 0);
      if (Number.isFinite(nestedRefreshAt) && nestedRefreshAt > 0) return nestedRefreshAt;
      const meta = (estimate as Record<string, unknown>).meta;
      if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
        const completedAtMs = Date.parse(String((meta as Record<string, unknown>).completedAt || ''));
        if (Number.isFinite(completedAtMs) && completedAtMs > 0) return completedAtMs + PENDING_REWARDS_REFRESH_MS;
        const startedAtMs = Date.parse(String((meta as Record<string, unknown>).startedAt || ''));
        if (Number.isFinite(startedAtMs) && startedAtMs > 0) return startedAtMs + PENDING_REWARDS_REFRESH_MS;
      }
      const calculatedTimeStampMs =
        Number(String((result as Record<string, unknown>).calculatedTimeStamp || '').replace(/,/g, '').trim()) * 1000;
      if (Number.isFinite(calculatedTimeStampMs) && calculatedTimeStampMs > 0) {
        return calculatedTimeStampMs + PENDING_REWARDS_REFRESH_MS;
      }
    }
  }
  return 0;
}

function getPendingRewardsRefreshAccountKey(data: any): string {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return '';
  const record = data as Record<string, unknown>;
  const directAccount = typeof record.accountKey === 'string' ? record.accountKey.trim() : '';
  if (directAccount) return directAccount;
  const call = record.call;
  if (call && typeof call === 'object' && !Array.isArray(call)) {
    const parameters = (call as Record<string, unknown>).parameters;
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const parameterAccountValue = (parameters as Record<string, unknown>)['Account Key'];
      const parameterAccount = typeof parameterAccountValue === 'string' ? parameterAccountValue.trim() : '';
      if (parameterAccount) return parameterAccount;
    }
  }
  const directResult = record.result;
  if (directResult && typeof directResult === 'object' && !Array.isArray(directResult)) {
    const resultAccount = String((directResult as Record<string, unknown>).accountKey || '').trim();
    if (resultAccount) return resultAccount;
  }
  const estimate = record.estimate;
  if (estimate && typeof estimate === 'object' && !Array.isArray(estimate)) {
    const estimateAccount = String((estimate as Record<string, unknown>).accountKey || '').trim();
    if (estimateAccount) return estimateAccount;
    const result = (estimate as Record<string, unknown>).result;
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      const resultAccount = String((result as Record<string, unknown>).accountKey || '').trim();
      if (resultAccount) return resultAccount;
    }
    const call = (estimate as Record<string, unknown>).call;
    const parameters =
      call && typeof call === 'object' && !Array.isArray(call)
        ? (call as Record<string, unknown>).parameters
        : null;
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const parameterAccount = String((parameters as Record<string, unknown>)['Account Key'] || '').trim();
      if (parameterAccount) return parameterAccount;
    }
  }
  return '';
}

function getPendingRewardsRefreshActionName(data: any): string {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'estimate';
  const record = data as Record<string, unknown>;
  const directAction =
    typeof record.__pendingRewardsRefreshActionName === 'string'
      ? record.__pendingRewardsRefreshActionName.trim()
      : '';
  if (directAction) return directAction;
  const call = record.call;
  if (call && typeof call === 'object' && !Array.isArray(call)) {
    const methodName = String((call as Record<string, unknown>).method || '').trim();
    if (PENDING_REWARDS_CLAIM_METHOD_NAMES.has(methodName)) return 'claim';
    if (PENDING_REWARDS_ESTIMATE_METHOD_NAMES.has(methodName)) return 'estimate';
    const parameters = (call as Record<string, unknown>).parameters;
    const mode =
      parameters && typeof parameters === 'object' && !Array.isArray(parameters)
        ? (parameters as Record<string, unknown>).mode
        : null;
    if (mode && typeof mode === 'object' && !Array.isArray(mode)) {
      const modeActionValue = (mode as Record<string, unknown>).action;
      const modeAction = typeof modeActionValue === 'string' ? modeActionValue.trim() : '';
      if (modeAction === 'claim' || modeAction === 'estimate') return modeAction;
    }
  }
  const estimate = record.estimate;
  if (estimate && typeof estimate === 'object' && !Array.isArray(estimate)) {
    const estimateAction = String((estimate as Record<string, unknown>).action || '').trim();
    if (estimateAction) return estimateAction;
    const result = (estimate as Record<string, unknown>).result;
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      const resultAction = String((result as Record<string, unknown>).__pendingRewardsRefreshActionName || '').trim();
      if (resultAction) return resultAction;
    }
  }
  return 'estimate';
}

function isPendingRewardsRefreshNode(label: string | undefined, data: any): boolean {
  const normalizedLabel = String(label || '').trim();
  return Boolean(
    (normalizedLabel === 'result' ||
      normalizedLabel.startsWith('result:')) &&
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      ((data as Record<string, unknown>).__pendingRewardsRefreshAction === true ||
        Boolean((data as Record<string, unknown>).estimate)),
  );
}

function isPendingRewardsInternalField(parent: any, childKey: string): boolean {
  return isPendingRewardsRecord(parent) && childKey === 'pendingRewards';
}

function isPendingRewardsTotalActionField(parent: any, childKey: string): boolean {
  return (
    isPendingRewardsRecord(parent) &&
    (childKey === 'estimateOffChainTotalRewards' || childKey === 'claimOnChainTotalRewards')
  );
}

function isPendingRewardsContainerSummaryField(parent: any, childKey: string): boolean {
  if (
    !parent ||
    typeof parent !== 'object' ||
    Array.isArray(parent) ||
    (parent as Record<string, unknown>).TYPE !== '--PENDING_REWARDS--'
  ) {
    return false;
  }

  return [
    'lastSponsorTimeStamp',
    'lastRecipientTimeStamp',
    'lastAgentTimeStamp',
    'lastSponsorUpdate',
    'lastRecipientUpdate',
    'lastAgentUpdate',
    'timeDifference',
    'timeDifferenceMS',
    'formattedDifference',
    'pendingSponsorRewards',
    'pendingRecipientRewards',
    'pendingAgentRewards',
    'pendingTotalRewards',
    'totalRewards',
  ].includes(childKey);
}

function isAccountRoleCountDisplayField(parent: any, childKey: string): boolean {
  if (
    !parent ||
    typeof parent !== 'object' ||
    Array.isArray(parent) ||
    (parent as Record<string, unknown>).TYPE !== '--ACCOUNT--'
  ) {
    return false;
  }

  return (
    childKey === 'sponsorCount' ||
    childKey === 'recipientCount' ||
    childKey === 'agentCount' ||
    childKey === 'parentRecipientCount'
  );
}

function getPendingRewardsMethodName(label: string | undefined, data: any): string {
  if (isPendingRewardsIncludedMethodNode(data)) {
    return String((data as Record<string, unknown>).method || label || '').trim();
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const call = (data as Record<string, unknown>).call;
    const callMethod =
      call && typeof call === 'object' && !Array.isArray(call)
        ? String((call as Record<string, unknown>).method || '').trim()
        : '';
    if (PENDING_REWARDS_METHOD_NAMES.has(callMethod)) return callMethod;
  }
  return '';
}

function ensurePendingRewardsMethodEntries(entries: Array<[string, any]>): Array<[string, any]> {
  const expectedMethods = [
    'estimateOffChainSponsorRewards',
    'claimOnChainSponsorRewards',
    'estimateOffChainRecipientRewards',
    'claimOnChainRecipientRewards',
    'estimateOffChainAgentRewards',
    'claimOnChainAgentRewards',
  ];
  const missingMethods = expectedMethods.filter((method) => !entries.some(([key]) => key === method));
  if (missingMethods.length === 0) return entries;
  const nextEntries = [...entries];
  const modeIndex = nextEntries.findIndex(([key]) => key === 'mode');
  const insertIndex = modeIndex >= 0 ? modeIndex + 1 : 0;
  const methodEntries = missingMethods.map((method): [string, any] => [
    method,
    { __pendingRewardsIncludedMethod: true },
  ]);
  nextEntries.splice(insertIndex, 0, ...methodEntries);
  return nextEntries;
}

function shouldInjectPendingRewardsMethodEntries(
  label: string | undefined,
  path: string | undefined,
  value: any,
): boolean {
  if (!isPendingRewardsRecord(value)) return false;
  if (label !== 'pendingRewards') return false;
  const normalizedPath = String(path || '');
  if (
    normalizedPath.split('.').includes('rewardCalculation') ||
    normalizedPath.split('.').includes('rewardCalculations')
  ) return false;
  return true;
}

function filterPendingRewardsRoleEntries(
  entries: Array<[string, any]>,
  counts: AccountRoleCounts | null | undefined,
): Array<[string, any]> {
  return entries.filter(([key]) => hasRoleCountForPendingRewardsKey(key, counts));
}

function shouldForceExpandNode(data: any): boolean {
  return Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      (data as Record<string, unknown>).__forceExpanded === true,
  );
}

function shouldShowEmptyChildren(data: any): boolean {
  return Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      ((data as Record<string, unknown>).__showEmptyFields === true || isPendingRewardsRecord(data)),
  );
}

function getExpandedPathKey(path: string) {
  return `__expanded__:${path}`;
}

function getAncestorPaths(path: string): string[] {
  const segments = String(path || '').split('.').filter(Boolean);
  return segments.slice(0, -1).map((_, index) => segments.slice(0, index + 1).join('.'));
}

function getExpandedAncestorPathKeys(path: string): string[] {
  return getAncestorPaths(path).map(getExpandedPathKey);
}

function normalizeLegacyDateDisplay(value: any): string | null {
  const parseScriptCreatedDate = (input: string): string | null => {
    const normalized = String(input || '').trim().replace(/_/g, ' ');
    const match = normalized.match(
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{1,2})-(\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?$/i,
    );
    if (!match) return null;
    const [, monthText, dayText, yearText, hourText, minuteText, secondText = '00'] = match;
    const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(
      monthText.toLowerCase(),
    );
    if (monthIndex < 0) return null;
    const date = new Date(
      Number(yearText),
      monthIndex,
      Number(dayText),
      Number(hourText),
      Number(minuteText),
      Number(secondText),
    );
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };
  const normalizeDisplayDateString = (input: string): string | null => {
    const trimmed = String(input || '').trim();
    const scriptCreatedDate = parseScriptCreatedDate(trimmed);
    if (scriptCreatedDate) return scriptCreatedDate;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(trimmed)) return trimmed;
    const normalized = trimmed.replace(/_/g, ' ');
    const shortMonthMatch = normalized.match(
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{1,2})-(\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?\s+(a\.m\.|p\.m\.)(?:\s+([A-Z]{2,5}))?$/i,
    );
    if (shortMonthMatch) {
      const [, monthText, dayText, yearText, hourText, minuteText, secondText, millisecondText, meridiem, timeZone] =
        shortMonthMatch;
      const normalizedDay = String(Number(dayText)).padStart(2, '0');
      const secondsPart = secondText ? `:${secondText}.${(millisecondText || '000').padEnd(3, '0')}` : '';
      const normalizedMeridiem = meridiem.toLowerCase() === 'a.m.' ? 'a.m.' : 'p.m.';
      return `${monthText.toUpperCase()}-${normalizedDay}-${yearText}, ${Number(hourText)}:${minuteText}${secondsPart} ${normalizedMeridiem}${
        timeZone ? ` ${timeZone.toUpperCase()}` : ''
      }`;
    }
    const match = normalized.match(
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)(?:\s+([A-Z]{2,5}))?$/i,
    );
    if (!match) return null;

    const [, monthName, day, year, hourText, minute, , meridiem] = match;
    const monthMap: Record<string, string> = {
      january: 'JAN',
      february: 'FEB',
      march: 'MAR',
      april: 'APR',
      may: 'MAY',
      june: 'JUN',
      july: 'JUL',
      august: 'AUG',
      september: 'SEP',
      october: 'OCT',
      november: 'NOV',
      december: 'DEC',
    };
    const month = monthMap[monthName.toLowerCase()] || 'JAN';
    const normalizedDay = String(Number(day)).padStart(2, '0');
    const hour = String(Number(hourText));
    const normalizedMeridiem = meridiem.toUpperCase() === 'AM' ? 'a.m.' : 'p.m.';
    return `${month}-${normalizedDay}-${year}, ${hour}:${minute} ${normalizedMeridiem}`;
  };

  if (typeof value === 'string') return normalizeDisplayDateString(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length !== 1) return null;
  const [outerKey, outerValue] = entries[0];
  if (!outerValue || typeof outerValue !== 'object' || Array.isArray(outerValue)) return null;
  const innerEntries = Object.entries(outerValue as Record<string, unknown>);
  if (innerEntries.length !== 1) return null;
  const [minuteKey, secondValue] = innerEntries[0];
  if (typeof secondValue !== 'string') return null;
  return normalizeDisplayDateString(`${outerKey}:${minuteKey}:${secondValue}`);
}

function formatDateObjectDisplay(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hour24 = date.getHours();
  const hour12 = hour24 % 12 || 12;
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  const millisecond = String(date.getMilliseconds()).padStart(3, '0');
  const meridiem = hour24 < 12 ? 'a.m.' : 'p.m.';
  const timeZone =
    date
      .toLocaleTimeString('en-US', { timeZoneName: 'short' })
      .split(' ')
      .pop() || '';
  return `${month}-${day}-${year}, ${hour12}:${minute}:${second}.${millisecond} ${meridiem}${timeZone ? ` ${timeZone}` : ''}`;
}

function formatTimestampDateDisplay(value: unknown): string | null {
  const raw = String(value ?? '').replace(/,/g, '').trim();
  if (!raw || raw === '0') return 'N/A';
  if (!/^\d+$/.test(raw)) {
    const normalized = normalizeLegacyDateDisplay(value);
    if (!normalized) return null;
    const parsedDate = new Date(normalized);
    return formatDateObjectDisplay(parsedDate) ?? normalized;
  }
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) return 'N/A';
  const date = new Date(seconds * 1000);
  return formatDateObjectDisplay(date);
}

function isRewardUpdateTimestampKey(key: string): boolean {
  return /^(startedAt|completedAt|lastSponsorUpdate|lastRecipientUpdate|lastAgentUpdate|lastSponsorUpdateTimeStamp|lastRecipientUpdateTimeStamp|lastAgentUpdateTimeStamp|formatted[A-Za-z]*TimeStamp|formatted[A-Za-z]*Timestamp)$/i.test(
    String(key || '').trim(),
  );
}

const ACCOUNT_UPDATE_TIMESTAMP_KEYS = [
  'lastSponsorUpdateTimeStamp',
  'lastRecipientUpdateTimeStamp',
  'lastAgentUpdateTimeStamp',
];

function hasAccountUpdateTimestampEntries(record: Record<string, unknown>): boolean {
  return ACCOUNT_UPDATE_TIMESTAMP_KEYS.some((key) => Object.prototype.hasOwnProperty.call(record, key));
}

function insertAccountUpdateTimestampsInMeta(
  meta: Record<string, unknown>,
  accountRecord: Record<string, unknown>,
): Record<string, unknown> {
  const timestampEntries = ACCOUNT_UPDATE_TIMESTAMP_KEYS
    .filter((key) => Object.prototype.hasOwnProperty.call(accountRecord, key))
    .map((key): [string, unknown] => [key, accountRecord[key]]);
  if (timestampEntries.length === 0) return meta;

  const entries = Object.entries(meta);
  const nextEntries: Array<[string, unknown]> = [];
  let inserted = false;

  for (const entry of entries) {
    nextEntries.push(entry);
    if (entry[0] === 'completedAt') {
      nextEntries.push(...timestampEntries);
      inserted = true;
    }
  }

  if (!inserted) nextEntries.push(...timestampEntries);
  return Object.fromEntries(nextEntries);
}

function moveAccountUpdateTimestampsToMeta(value: any): any {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const meta = record.meta;
  const result = record.result;
  if (
    !meta ||
    typeof meta !== 'object' ||
    Array.isArray(meta) ||
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result) ||
    !hasAccountUpdateTimestampEntries(result as Record<string, unknown>)
  ) {
    return value;
  }

  const resultRecord = result as Record<string, unknown>;
  const resultWithoutUpdateTimestamps = Object.fromEntries(
    Object.entries(resultRecord).filter(([key]) => !ACCOUNT_UPDATE_TIMESTAMP_KEYS.includes(key)),
  );

  return {
    ...record,
    meta: insertAccountUpdateTimestampsInMeta(meta as Record<string, unknown>, resultRecord),
    result: resultWithoutUpdateTimestamps,
  };
}

function normalizeAccountRecordDisplayShape(
  value: any,
  options: { suppressPendingRewardsLift?: boolean } = {},
): any {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if (record.TYPE !== '--ACCOUNT--') return value;

  const totalSpCoinsRecord =
    record.totalSpCoins && typeof record.totalSpCoins === 'object' && !Array.isArray(record.totalSpCoins)
      ? (record.totalSpCoins as Record<string, unknown>)
      : null;
  const nestedPendingRewards = totalSpCoinsRecord?.pendingRewards;
  const hasStakingRewards = Object.prototype.hasOwnProperty.call(record, 'stakingRewards');
  const needsTotalSpCoinsPrune =
    totalSpCoinsRecord &&
    Object.prototype.hasOwnProperty.call(totalSpCoinsRecord, 'pendingRewards');
  const needsPendingRewardsLift =
    !options.suppressPendingRewardsLift &&
    nestedPendingRewards !== undefined &&
    !Object.prototype.hasOwnProperty.call(record, 'pendingRewards');

  if (!hasStakingRewards && !needsTotalSpCoinsPrune && !needsPendingRewardsLift) return value;

  const nextEntries: Array<[string, unknown]> = [];
  for (const [key, entryValue] of Object.entries(record)) {
    if (key === 'stakingRewards') {
      nextEntries.push(['rewardsEarned', entryValue]);
      continue;
    }

    if (key === 'totalSpCoins' && totalSpCoinsRecord) {
      nextEntries.push([
        key,
        Object.fromEntries(
          Object.entries(totalSpCoinsRecord).filter(
            ([childKey]) => childKey !== 'pendingRewards',
          ),
        ),
      ]);
      if (needsPendingRewardsLift) {
        nextEntries.push(['pendingRewards', nestedPendingRewards]);
      }
      continue;
    }

    nextEntries.push([key, entryValue]);
  }

  return Object.fromEntries(nextEntries);
}

function toOnChainMsNumber(value: unknown): number {
  const parsed = Number(String(value ?? '0').replace(/,/g, '').trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getOnChainCallsTotalMs(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
  return toOnChainMsNumber((value as Record<string, unknown>).totalOnChainMs);
}

function getDirectOnChainCallsMs(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
  const calls = (value as Record<string, unknown>).calls;
  if (!Array.isArray(calls)) return 0;
  return calls.reduce((sum, entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return sum;
    return sum + toOnChainMsNumber((entry as Record<string, unknown>).onChainRunTimeMs);
  }, 0);
}

function withPendingRewardsTiming(record: Record<string, unknown>, pendingRewardsMs: number): Record<string, unknown> {
  if (pendingRewardsMs <= 0) return record;
  const pendingRewards = record.pendingRewards;
  if (!pendingRewards || typeof pendingRewards !== 'object' || Array.isArray(pendingRewards)) return record;
  if (Object.prototype.hasOwnProperty.call(pendingRewards, 'totalOnChainMs')) return record;
  return {
    ...record,
    pendingRewards: {
      ...(pendingRewards as Record<string, unknown>),
      totalOnChainMs: pendingRewardsMs,
    },
  };
}

function addPendingRewardsTimingToStepResult(value: any): any {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const result =
    record.result && typeof record.result === 'object' && !Array.isArray(record.result)
      ? (record.result as Record<string, unknown>)
      : null;
  const onChainCalls =
    record.onChainCalls && typeof record.onChainCalls === 'object' && !Array.isArray(record.onChainCalls)
      ? (record.onChainCalls as Record<string, unknown>)
      : null;
  if (!result || result.TYPE !== '--ACCOUNT--' || !onChainCalls) return value;

  const pendingRewardsMs = getOnChainCallsTotalMs(onChainCalls) - getDirectOnChainCallsMs(onChainCalls);
  if (pendingRewardsMs <= 0) return value;

  return {
    ...record,
    result: withPendingRewardsTiming(result, pendingRewardsMs),
  };
}

function isLiftedAccountPendingRewardsDisplayEntry(parent: any, key: string, value: any): boolean {
  if (key !== 'pendingRewards') return false;
  if (!parent || typeof parent !== 'object' || Array.isArray(parent)) return false;
  const record = parent as Record<string, unknown>;
  if (record.TYPE !== '--ACCOUNT--' || Object.prototype.hasOwnProperty.call(record, 'pendingRewards')) return false;
  const totalSpCoinsRecord =
    record.totalSpCoins && typeof record.totalSpCoins === 'object' && !Array.isArray(record.totalSpCoins)
      ? (record.totalSpCoins as Record<string, unknown>)
      : null;
  return Boolean(totalSpCoinsRecord && totalSpCoinsRecord.pendingRewards === value);
}

function getDisplayEntryPath(parentPath: string, parent: any, key: string, value: any): string {
  if (isLiftedAccountPendingRewardsDisplayEntry(parent, key, value)) {
    return `${parentPath}.totalSpCoins.pendingRewards`;
  }
  return `${parentPath}.${key}`;
}

function hasPopulatedContent(
  value: any,
  hiddenRules: NonNullable<JsonInspectorProps['hiddenRules']>,
  showStructureType = false,
): boolean {
  if (value === null || value === undefined) return !hiddenRules.emptyValues;
  if (typeof value === 'boolean') return value || !hiddenRules.falseValues;
  if (typeof value === 'number') return Number.isFinite(value) && (value !== 0 || !hiddenRules.zeroValues);
  if (typeof value === 'bigint') return value !== 0n || !hiddenRules.zeroValues;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const normalized = trimmed.toLowerCase();
    if (!trimmed) return !hiddenRules.emptyValues;
    if (normalized === 'n/a') return !hiddenRules.emptyValues;
    if (normalized === '0') return !hiddenRules.zeroValues;
    if (normalized === 'false') return !hiddenRules.falseValues;
    if (normalized === 'todo') return !hiddenRules.todoValues;
    if (normalized === 'undefined' || normalized === 'null') return !hiddenRules.emptyValues;
    return true;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return !hiddenRules.emptyCollections;
    return value.some((entry) => hasPopulatedContent(entry, hiddenRules, showStructureType));
  }
  if (typeof value === 'object') {
    if (isLazyAccountRelationNode(value)) return true;
    const entries = Object.entries(value).filter(([key]) => showStructureType || key !== 'TYPE');
    if (entries.length === 0) return !hiddenRules.emptyCollections;
    return entries.some(([key, childValue]) => {
      if (key === 'TYPE') return showStructureType && hasPopulatedContent(childValue, hiddenRules, showStructureType);
      return hasPopulatedContent(childValue, hiddenRules, showStructureType);
    });
  }
  return true;
}

function hasVisibleDescendants(
  value: any,
  showAll: boolean,
  hiddenRules: NonNullable<JsonInspectorProps['hiddenRules']>,
  showStructureType = false,
): boolean {
  if (showAll) return true;
  if (!value || typeof value !== 'object') return true;
  return hasPopulatedContent(value, hiddenRules, showStructureType);
}

function isTokenAmountKey(key: string): boolean {
  return [
    'totalSupply',
    'totalSpCoins',
    'balanceOf',
    'stakedBalance',
    'stakedAmount',
    'rewardsEarned',
    'stakingRewards',
    'pendingRewards',
    'pendingSponsorRewards',
    'pendingRecipientRewards',
    'pendingAgentRewards',
    'pendingTotalRewards',
    'totalRewards',
    'totalRewardsClaimed',
    'Last Claimed Rewards',
    'sponsorRewardsClaimed',
    'recipientRewardsClaimed',
    'agentRewardsClaimed',
    'totalBalanceOf',
    'totalStakingRewards',
    'totalStakedSPCoins',
    'amount',
  ].includes(String(key || '').trim());
}

function isRedundantLastClaimedRewardsField(key: string): boolean {
  const normalized = String(key || '').trim();
  return normalized === 'Last Claimed Rewards' || normalized === 'lastClaimedRewards';
}

function isRedundantPendingRewardResultField(key: string): boolean {
  const normalized = String(key || '').trim();
  return (
    isRedundantLastClaimedRewardsField(normalized) ||
    normalized === 'timeDifferenceMS' ||
    normalized === 'formattedDifference'
  );
}

function stripRedundantPendingRewardResultFields(value: unknown, path?: string): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const next = { ...(value as Record<string, unknown>) };
  const claimMethodMatch = String(path || '').match(/claimOnChain(Sponsor|Recipient|Agent)Rewards/);
  const claimRole = claimMethodMatch?.[1] as DisplayAccountRole | undefined;
  if (
    claimRole &&
    Object.prototype.hasOwnProperty.call(next, 'claimedAmount') &&
    !Object.prototype.hasOwnProperty.call(next, `claimed${claimRole}Amount`)
  ) {
    next[`claimed${claimRole}Amount`] = next.claimedAmount;
    delete next.claimedAmount;
  }
  if (
    next.refreshedAccountRecord &&
    typeof next.refreshedAccountRecord === 'object' &&
    !Array.isArray(next.refreshedAccountRecord)
  ) {
    const refreshedAccountRecord = { ...(next.refreshedAccountRecord as Record<string, unknown>) };
    delete refreshedAccountRecord.pendingRewards;
    for (const key of ['lastSponsorUpdateTimeStamp', 'lastRecipientUpdateTimeStamp', 'lastAgentUpdateTimeStamp']) {
      if (
        Object.prototype.hasOwnProperty.call(refreshedAccountRecord, key) &&
        !Object.prototype.hasOwnProperty.call(next, key)
      ) {
        next[key] = refreshedAccountRecord[key];
      }
    }
    if (
      Object.prototype.hasOwnProperty.call(refreshedAccountRecord, 'rewardsEarned') &&
      !Object.prototype.hasOwnProperty.call(next, 'rewardsEarned')
    ) {
      next.rewardsEarned = refreshedAccountRecord.rewardsEarned;
    }
    if (
      Object.prototype.hasOwnProperty.call(refreshedAccountRecord, 'totalSpCoins') &&
      !Object.prototype.hasOwnProperty.call(next, 'totalSpCoins')
    ) {
      next.totalSpCoins = refreshedAccountRecord.totalSpCoins;
    }
    delete next.refreshedAccountRecord;
  }
  for (const key of Object.keys(next)) {
    if (isRedundantPendingRewardResultField(key)) {
      delete next[key];
    }
  }
  const preferredKeys = [
    'lastSponsorUpdateTimeStamp',
    'lastRecipientUpdateTimeStamp',
    'lastAgentUpdateTimeStamp',
    'balanceBefore',
    'claimedSponsorAmount',
    'claimedRecipientAmount',
    'claimedAgentAmount',
    'claimedAmount',
    'balanceAfter',
    'totalRewardsClaimed',
    'rewardsEarned',
    'totalSpCoins',
  ];
  const ordered: Record<string, unknown> = {};
  for (const key of preferredKeys) {
    if (Object.prototype.hasOwnProperty.call(next, key)) ordered[key] = next[key];
  }
  for (const [key, entry] of Object.entries(next)) {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) ordered[key] = entry;
  }
  return ordered;
}

function unwrapNumericDisplayString(value: unknown): { raw: string; wasQuoted: boolean } {
  const trimmed = String(value ?? '').trim();
  const wasQuoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  const unwrapped = wasQuoted ? trimmed.slice(1, -1).trim() : trimmed;
  return { raw: unwrapped.replace(/,/g, '').trim(), wasQuoted };
}

function displayFormattedAmount(value: unknown, tokenDecimals?: number | null): string | null {
  const { raw, wasQuoted } = unwrapNumericDisplayString(value);
  if (!/^-?\d+$/.test(raw)) return null;

  const decimals = Number.isInteger(tokenDecimals) && Number(tokenDecimals) >= 0 ? Number(tokenDecimals) : 18;
  const negativePrefix = raw.startsWith('-') ? '-' : '';
  const digits = raw.startsWith('-') ? raw.slice(1) : raw;
  const padded = digits.padStart(decimals + 1, '0');
  const integerPart = padded.slice(0, -decimals) || '0';
  const fractionalPart = padded.slice(-decimals).replace(/0+$/, '');
  const groupedInteger = BigInt(integerPart || '0').toLocaleString('en-US');
  const formatted = fractionalPart ? `${negativePrefix}${groupedInteger}.${fractionalPart}` : `${negativePrefix}${groupedInteger}`;
  return wasQuoted ? `"${formatted}"` : formatted;
}

function formatDisplayScalar(
  key: string,
  value: unknown,
  formatTokenAmounts: boolean,
  tokenDecimals?: number | null,
): string {
  if (isRewardUpdateTimestampKey(key)) {
    const formattedTimestamp = formatTimestampDateDisplay(value);
    if (formattedTimestamp) return `"${formattedTimestamp}"`;
  }
  const renderedValue = stringifyBigInt(value);
  if (formatTokenAmounts && isTokenAmountKey(key)) {
    return displayFormattedAmount(renderedValue, tokenDecimals) ?? String(renderedValue);
  }
  return typeof value === 'string' ? `"${String(value)}"` : String(renderedValue);
}

function renderFormulaDisplayValue(displayValue: string): React.ReactNode {
  if (!displayValue.includes('Σ')) return displayValue;
  const parts = displayValue.split('Σ');
  return parts.map((part, index) => (
    <React.Fragment key={`${part}-${index}`}>
      {index > 0 ? <span className="inline-block text-[1.5em] leading-none align-[-0.08em]">Σ</span> : null}
      {part}
    </React.Fragment>
  ));
}

function renderDisplayLabelWithStatusSuffix(label: string): React.ReactNode {
  const match = label.match(/^(.*?)(\s+\((?:Last Estimate|Last Claimed)\))$/);
  if (!match) return label;
  return (
    <>
      <span className="!text-white">{match[1]}</span>
      <span className="!text-yellow-300">{match[2]}</span>
    </>
  );
}

function formatPathSegmentLabel(nextPath: string): string {
  const segments = nextPath.split('.');
  const currentSegment = segments[segments.length - 1] || nextPath;
  const parentSegment = segments[segments.length - 2] || '';
  const indexedStepMatch = currentSegment.match(/^(step|script)-(\d+)$/i);
  if (indexedStepMatch) {
    const parsedIndex = Number(indexedStepMatch[2]);
    if (Number.isInteger(parsedIndex) && parsedIndex >= 0) {
      return `${indexedStepMatch[1]}-${parsedIndex + 1}`;
    }
  }
  if (
    /^(recipientRateBranches|agentRateBranches)$/.test(parentSegment) &&
    /^\d+(\.\d+)?$/.test(currentSegment)
  ) {
    return `${currentSegment}%`;
  }
  return currentSegment;
}

function getPendingRewardsMethodSummaryValue(
  methodName: string,
  data: unknown,
): { key: string; value: unknown } | null {
  if (!PENDING_REWARDS_METHOD_NAMES.has(methodName)) return null;
  const accountKey = getPendingRewardsRefreshAccountKey(data);
  return accountKey ? { key: 'accountKey', value: accountKey } : null;
}

function getPendingRewardsMethodResultSummaryValue(
  methodName: string,
  data: unknown,
): { key: string; value: unknown; suffix: string } | null {
  if (!PENDING_REWARDS_METHOD_NAMES.has(methodName)) return null;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  const result =
    record.result && typeof record.result === 'object' && !Array.isArray(record.result)
      ? (record.result as Record<string, unknown>)
      : null;
  if (!result) return null;

  if (methodName.startsWith('estimateOffChain') && methodName.endsWith('Rewards')) {
    const value = result.pendingTotalRewards ?? result.pendingRewards ?? result.totalRewards;
    return value === undefined || value === null ? null : { key: 'pendingTotalRewards', value, suffix: '(Last Estimate)' };
  }

  if (methodName.startsWith('claimOnChain') && methodName.endsWith('Rewards')) {
    const value = result.totalRewardsClaimed ?? result.claimedAmount;
    return value === undefined || value === null ? null : { key: 'totalRewardsClaimed', value, suffix: '(Last Claimed)' };
  }

  return null;
}

function roleFromPendingRewardsMethod(methodName: string): DisplayAccountRole | '' {
  if (/SponsorRewards$/i.test(methodName)) return 'Sponsor';
  if (/RecipientRewards$/i.test(methodName)) return 'Recipient';
  if (/AgentRewards$/i.test(methodName)) return 'Agent';
  return '';
}

function normalizeVisibleEntry(parent: any, childKey: string, childValue: any): [string, any] {
  const parentRecord =
    parent && typeof parent === 'object' && !Array.isArray(parent)
      ? (parent as Record<string, unknown>)
      : null;
  const parentMethod = String(
    parentRecord?.method ||
      (parentRecord?.call && typeof parentRecord.call === 'object' && !Array.isArray(parentRecord.call)
        ? (parentRecord.call as Record<string, unknown>).method
        : '') ||
      '',
  ).trim();
  const claimRole = parentMethod.startsWith('claimOnChain') ? roleFromPendingRewardsMethod(parentMethod) : '';
  if (childKey === 'claimedAmount' && claimRole) {
    return [`claimed${claimRole}Amount`, childValue];
  }
  if (childKey === 'rewardCalculation') {
    return ['rewardCalculations', childValue];
  }
  if (
    childKey === 'calculatedFormatted' &&
    String(childValue ?? '').trim() === '' &&
    parent &&
    typeof parent === 'object' &&
    !Array.isArray(parent) &&
    Object.prototype.hasOwnProperty.call(parent, 'calculatedTimeStamp')
  ) {
    return [childKey, calculateFormattedDT((parent as Record<string, unknown>).calculatedTimeStamp)];
  }
  return [childKey, childValue];
}

const rewardFormulaFields = [
  {
    legacyKey: 'timeDiffFormula',
    displayKey: 'sponsorBucketTimeDiffSeconds[t]',
    fallback: 'max(0, settlementTimestamp - sponsorBucketLastUpdateTimeStamp[t])',
  },
  {
    legacyKey: 'bucketPendingRewardsFormula',
    displayKey: 'sponsorBucketPendingRewards[t]',
    fallback:
      'floor((sponsorBucketTimeDiffSeconds[t] * sponsorBucketStakedQuantity[t] * sponsorBucketRate[t]) / 100 / yearSeconds)',
  },
  {
    legacyKey: 'totalPendingRewardsFormula',
    displayKey: 'grossSponsorPendingRewards',
    fallback: '\u03A3_t sponsorBucketPendingRewards[t]',
  },
  {
    legacyKey: 'recipientBucketPendingRewardsFormula',
    displayKey: 'recipientBucketPendingRewards[r]',
    fallback:
      'floor((recipientBucketTimeDiffSeconds[r] * recipientBucketStakedQuantity[r] * recipientRate[r]) / 100 / yearSeconds)',
  },
  {
    legacyKey: 'recipientPendingRewardsFormula',
    displayKey: 'recipientPendingRewards',
    fallback: '\u03A3_r recipientBucketPendingRewards[r]',
  },
  {
    legacyKey: 'agentBucketPendingRewardsFormula',
    displayKey: 'agentBucketPendingRewards[a]',
    fallback:
      'floor((agentBucketTimeDiffSeconds[a] * agentBucketStakedQuantity[a] * agentRate[a]) / 100 / yearSeconds)',
  },
  {
    legacyKey: 'agentPendingRewardsFormula',
    displayKey: 'agentPendingRewards',
    fallback: '\u03A3_a agentBucketPendingRewards[a]',
  },
  {
    legacyKey: 'downstreamRewardsFormula',
    displayKey: 'downstreamPendingRewards',
    fallback: 'recipientPendingRewards + agentPendingRewards',
  },
  {
    legacyKey: 'sponsorPendingRewardsFormula',
    displayKey: 'netSponsorPendingRewards',
    fallback: 'grossSponsorPendingRewards - downstreamPendingRewards',
  },
];

function isCompactRewardFormulaDisplayGroup(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return rewardFormulaFields.some((field) => Object.prototype.hasOwnProperty.call(record, field.displayKey));
}

function normalizeRewardCalculationDisplayShape(
  value: any,
  accountRoleCounts?: AccountRoleCounts | null,
  label?: string,
): any {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if (label === 'rewardNotations') {
    const nextNotations = { ...record };
    delete nextNotations.rewardsFormula;
    delete nextNotations.rewardFormulas;
    delete nextNotations.secondsInYear;
    delete nextNotations.yearsInSeconds;
    delete nextNotations.role;
    return nextNotations;
  }
  if (label === 'rewardValues') {
    const nextRewardValues = { ...record };
    delete nextRewardValues.role;
    delete nextRewardValues.rewardsFormula;
    delete nextRewardValues.rewardFormulas;
    delete nextRewardValues.rewardsNotations;
    delete nextRewardValues.rewardNotations;
    delete nextRewardValues.rewardFormulsValues;
    delete nextRewardValues.rewardValues;
    return nextRewardValues;
  }
  const roleFromMethod = (methodValue: unknown): 'Sponsor' | 'Recipient' | 'Agent' | 'Total' | '' => {
    const methodName = String(methodValue ?? '').trim();
    if (/SponsorRewards$/i.test(methodName)) return 'Sponsor';
    if (/RecipientRewards$/i.test(methodName)) return 'Recipient';
    if (/AgentRewards$/i.test(methodName)) return 'Agent';
    if (/TotalRewards$/i.test(methodName)) return 'Total';
    return '';
  };
  const roleFromRewardValues = (rewardValues: Record<string, unknown>): 'Sponsor' | 'Recipient' | 'Agent' | 'Total' | '' => {
    const explicitRole = String(rewardValues.role ?? '').trim();
    if (['Sponsor', 'Recipient', 'Agent', 'Total'].includes(explicitRole)) {
      return explicitRole as 'Sponsor' | 'Recipient' | 'Agent' | 'Total';
    }
    if (
      Object.prototype.hasOwnProperty.call(rewardValues, 'lastSponsorTimeStamp') ||
      Object.prototype.hasOwnProperty.call(rewardValues, 'lastSponsorUpdate') ||
      Object.prototype.hasOwnProperty.call(rewardValues, 'lastSponsorUpdateTimeStamp')
    ) return 'Sponsor';
    if (
      Object.prototype.hasOwnProperty.call(rewardValues, 'lastRecipientTimeStamp') ||
      Object.prototype.hasOwnProperty.call(rewardValues, 'lastRecipientUpdate') ||
      Object.prototype.hasOwnProperty.call(rewardValues, 'lastRecipientUpdateTimeStamp')
    ) return 'Recipient';
    if (
      Object.prototype.hasOwnProperty.call(rewardValues, 'lastAgentTimeStamp') ||
      Object.prototype.hasOwnProperty.call(rewardValues, 'lastAgentUpdate') ||
      Object.prototype.hasOwnProperty.call(rewardValues, 'lastAgentUpdateTimeStamp')
    ) return 'Agent';
    if (
      Object.prototype.hasOwnProperty.call(rewardValues, 'sponsorBucketLastUpdateTimeStamp') ||
      Object.prototype.hasOwnProperty.call(rewardValues, 'pendingSponsorRewards')
    ) return 'Sponsor';
    if (
      Object.prototype.hasOwnProperty.call(rewardValues, 'recipientBucketLastUpdateTimeStamp') ||
      Object.prototype.hasOwnProperty.call(rewardValues, 'pendingRecipientRewards')
    ) return 'Recipient';
    if (
      Object.prototype.hasOwnProperty.call(rewardValues, 'agentBucketLastUpdateTimeStamp') ||
      Object.prototype.hasOwnProperty.call(rewardValues, 'pendingAgentRewards')
    ) return 'Agent';
    return '';
  };
  const stripFormulaLeftHandSide = (formulaValue: unknown, displayKey: string) => {
    if (typeof formulaValue !== 'string') return formulaValue;
    const prefix = `${displayKey} =`;
    const normalizeFormulaTerms = (formula: string) =>
      formula
        .replace(/bucketLastUpdateTimeStamp/g, 'sponsorBucketLastUpdateTimeStamp[t]')
        .replace(/totalPendingRewards/g, 'grossSponsorPendingRewards')
        .replace(/downstreamRewards/g, 'downstreamPendingRewards')
        .replace(/sponsorPendingRewards/g, 'netSponsorPendingRewards');
    if (formulaValue.startsWith(prefix)) return normalizeFormulaTerms(formulaValue.slice(prefix.length).trim());
    const legacyFormulaMatch = formulaValue.match(/^[A-Za-z0-9_[\]]+\s*=\s*(.+)$/);
    return normalizeFormulaTerms(legacyFormulaMatch ? legacyFormulaMatch[1].trim() : formulaValue);
  };
  const compactRewardFormulaGroup = (
    formulaRecord: Record<string, unknown>,
    roleValue?: unknown,
    options?: { includeMeta?: boolean },
  ) => {
    const nestedRewardsFormula =
      (formulaRecord.rewardFormulas || formulaRecord.rewardsFormula) &&
      typeof (formulaRecord.rewardFormulas || formulaRecord.rewardsFormula) === 'object' &&
      !Array.isArray(formulaRecord.rewardFormulas || formulaRecord.rewardsFormula)
        ? ((formulaRecord.rewardFormulas || formulaRecord.rewardsFormula) as Record<string, unknown>)
        : {};
    const sourceFormulaRecord = {
      ...nestedRewardsFormula,
      ...formulaRecord,
    };
    delete sourceFormulaRecord.rewardsFormula;
    delete sourceFormulaRecord.rewardFormulas;
    const nestedRewardFormulsValues =
      (sourceFormulaRecord.rewardValues || sourceFormulaRecord.rewardFormulsValues) &&
      typeof (sourceFormulaRecord.rewardValues || sourceFormulaRecord.rewardFormulsValues) === 'object' &&
      !Array.isArray(sourceFormulaRecord.rewardValues || sourceFormulaRecord.rewardFormulsValues)
        ? ((sourceFormulaRecord.rewardValues || sourceFormulaRecord.rewardFormulsValues) as Record<string, unknown>)
        : {};
    const normalizedRole = String(roleValue || roleFromRewardValues(nestedRewardFormulsValues) || '').trim();
    const defaultRewardsNotations: Record<string, unknown> = {
      yearSeconds: '31556925 seconds = 365.2421875 days',
      t: 'sponsor/rate bucket index',
      r: 'recipient-rate bucket index',
      a: 'agent-rate bucket index',
    };
    const sourceNotations =
      (sourceFormulaRecord.rewardNotations || sourceFormulaRecord.rewardsNotations) &&
      typeof (sourceFormulaRecord.rewardNotations || sourceFormulaRecord.rewardsNotations) === 'object' &&
      !Array.isArray(sourceFormulaRecord.rewardNotations || sourceFormulaRecord.rewardsNotations)
        ? ((sourceFormulaRecord.rewardNotations || sourceFormulaRecord.rewardsNotations) as Record<string, unknown>)
        : sourceFormulaRecord.indexNotation &&
            typeof sourceFormulaRecord.indexNotation === 'object' &&
            !Array.isArray(sourceFormulaRecord.indexNotation)
          ? (sourceFormulaRecord.indexNotation as Record<string, unknown>)
          : {};
    const compactSourceNotations = { ...sourceNotations };
    delete compactSourceNotations.rewardsFormula;
    delete compactSourceNotations.rewardFormulas;
    delete compactSourceNotations.secondsInYear;
    delete compactSourceNotations.yearsInSeconds;
    delete compactSourceNotations.role;
    const rewardNotations: Record<string, unknown> = {
      ...defaultRewardsNotations,
      ...compactSourceNotations,
    };
    const compact: Record<string, unknown> = options?.includeMeta === false ? {} : { rewardNotations };
    rewardFormulaFields.forEach((field) => {
      const formulaValue = sourceFormulaRecord[field.displayKey] ?? sourceFormulaRecord[field.legacyKey] ?? field.fallback;
      compact[field.displayKey] = stripFormulaLeftHandSide(formulaValue, field.displayKey);
    });
    const sourceRewardValues = sourceFormulaRecord.rewardValues ?? sourceFormulaRecord.rewardFormulsValues;
    if (options?.includeMeta !== false && sourceRewardValues !== undefined) {
      compact.rewardValues =
        sourceRewardValues &&
        typeof sourceRewardValues === 'object' &&
        !Array.isArray(sourceRewardValues)
          ? normalizeRewardFormulsValuesDisplayShape(
              sourceRewardValues as Record<string, unknown>,
              normalizedRole,
            )
          : sourceRewardValues;
    }
    return compact;
  };
  const hasRewardFormulaGroupFields =
    Object.prototype.hasOwnProperty.call(record, 'rewardsNotations') ||
    Object.prototype.hasOwnProperty.call(record, 'rewardNotations') ||
    Object.prototype.hasOwnProperty.call(record, 'indexNotation') ||
    rewardFormulaFields.some((field) => Object.prototype.hasOwnProperty.call(record, field.displayKey)) ||
    Object.prototype.hasOwnProperty.call(record, 'totalPendingRewardsFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'bucketPendingRewardsFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'timeDiffFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'downstreamRewardsFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'recipientPendingRewardsFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'agentPendingRewardsFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'sponsorPendingRewardsFormula');
  const hasRewardCalculationContainerFields =
    Object.prototype.hasOwnProperty.call(record, 'rewardPathFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'source') ||
    Object.prototype.hasOwnProperty.call(record, 'method') ||
    Object.prototype.hasOwnProperty.call(record, 'role');
  const roleSingleSource = getRoleSingleSource(accountRoleCounts);
  if (hasRewardFormulaGroupFields && !hasRewardCalculationContainerFields) {
    return compactRewardFormulaGroup(record, roleSingleSource.role, { includeMeta: label !== 'rewardFormulas' });
  }
  if (
    Object.prototype.hasOwnProperty.call(record, 'sponsorBucketLastUpdateTimeStamp') &&
    Object.prototype.hasOwnProperty.call(record, 'pendingTotalRewards')
  ) {
    return normalizeRewardFormulsValuesDisplayShape(record, roleSingleSource.role);
  }
  const looksLikeRewardCalculation =
    Object.prototype.hasOwnProperty.call(record, 'rewardPathFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'rewardsFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'rewardFormulas') ||
    Object.prototype.hasOwnProperty.call(record, 'rewardFormulsValues') ||
    Object.prototype.hasOwnProperty.call(record, 'rewardValues') ||
    Object.prototype.hasOwnProperty.call(record, 'source') ||
    Object.prototype.hasOwnProperty.call(record, 'method') ||
    Object.prototype.hasOwnProperty.call(record, 'role') ||
    Object.prototype.hasOwnProperty.call(record, 'parentRewardFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'sponsorDepositFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'totalStakedRewardsFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'totalPendingRewardsFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'downstreamRewardsFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'sponsorStakedTokensFormula');
  if (!looksLikeRewardCalculation) return value;

  const isRewardCalculationContainer =
    Object.prototype.hasOwnProperty.call(record, 'rewardPathFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'rewardsFormula') ||
    Object.prototype.hasOwnProperty.call(record, 'rewardFormulas') ||
    Object.prototype.hasOwnProperty.call(record, 'rewardFormulsValues') ||
    Object.prototype.hasOwnProperty.call(record, 'rewardValues') ||
    Object.prototype.hasOwnProperty.call(record, 'source') ||
    Object.prototype.hasOwnProperty.call(record, 'method') ||
    Object.prototype.hasOwnProperty.call(record, 'role');
  if (!isRewardCalculationContainer) return value;

  const next = { ...record };
  delete next.rewardPathFormula;
  delete next.timeDifferenceMS;
  delete next.lastAgentTimeStamp;
  delete next.lastAgentUpdate;
  delete next.formattedDifference;
  delete next.method;
  delete next.accountKey;
  const initialRewardPathRecord =
    next.rewardPathFormula && typeof next.rewardPathFormula === 'object' && !Array.isArray(next.rewardPathFormula)
      ? (next.rewardPathFormula as Record<string, unknown>)
      : {};
  const accountRole = roleSingleSource.role;
  if (accountRole) {
    next.role = accountRole;
  } else if (!Object.prototype.hasOwnProperty.call(next, 'role')) {
    const derivedRole =
      roleFromMethod(next.method) ||
      roleFromRewardValues(initialRewardPathRecord);
    if (derivedRole) next.role = derivedRole;
  }
  const currentRewardPathFormula = (roleValue: unknown) => {
    const normalizedRole = String(roleValue || '').trim();
    if (normalizedRole === 'Sponsor') {
      return [
        'grossSponsorPendingRewards = \u03A3_t sponsorBucketPendingRewards[t]',
        'downstreamPendingRewards = recipientPendingRewards + agentPendingRewards',
        'netSponsorPendingRewards = grossSponsorPendingRewards - downstreamPendingRewards',
      ];
    }
    if (normalizedRole === 'Recipient') {
      return [
        'recipientPendingRewards = \u03A3_r recipientBucketPendingRewards[r]',
        'agentPendingRewards may be downstream from Recipient when Agent rates exist',
      ];
    }
    if (normalizedRole === 'Agent') {
      return ['agentPendingRewards = \u03A3_a agentBucketPendingRewards[a]'];
    }
    return [
      'grossSponsorPendingRewards = netSponsorPendingRewards + downstreamPendingRewards',
      'each role is summed from its applicable sponsor/recipient/agent rate buckets',
    ];
  };
  if (Object.prototype.hasOwnProperty.call(next, 'rewardPathFormula')) {
    next.rewardPathFormula = currentRewardPathFormula(next.role);
  }
  const existingRewardsFormula =
    (next.rewardFormulas || next.rewardsFormula) &&
    typeof (next.rewardFormulas || next.rewardsFormula) === 'object' &&
    !Array.isArray(next.rewardFormulas || next.rewardsFormula)
      ? ((next.rewardFormulas || next.rewardsFormula) as Record<string, unknown>)
      : {};
  const existingNestedRewardFormulsValues =
    (existingRewardsFormula.rewardValues || existingRewardsFormula.rewardFormulsValues) &&
    typeof (existingRewardsFormula.rewardValues || existingRewardsFormula.rewardFormulsValues) === 'object' &&
    !Array.isArray(existingRewardsFormula.rewardValues || existingRewardsFormula.rewardFormulsValues)
      ? ((existingRewardsFormula.rewardValues || existingRewardsFormula.rewardFormulsValues) as Record<string, unknown>)
      : {};
  const existingTopLevelRewardFormulsValues =
    (next.rewardValues || next.rewardFormulsValues) &&
    typeof (next.rewardValues || next.rewardFormulsValues) === 'object' &&
    !Array.isArray(next.rewardValues || next.rewardFormulsValues)
      ? ((next.rewardValues || next.rewardFormulsValues) as Record<string, unknown>)
      : {};
  const existingRewardFormulsValues = {
    ...existingNestedRewardFormulsValues,
    ...existingTopLevelRewardFormulsValues,
  };
  if (accountRole) {
    next.role = accountRole;
  } else if (!Object.prototype.hasOwnProperty.call(next, 'role')) {
    const derivedRole = roleFromRewardValues(existingRewardFormulsValues);
    if (derivedRole) next.role = derivedRole;
  }
  const moveFields = (keys: string[], target: Record<string, unknown>) => {
    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(next, key) && !Object.prototype.hasOwnProperty.call(target, key)) {
        target[key] = next[key];
      }
      delete next[key];
    });
  };
  moveFields(
    [
      'indexNotation',
      'rewardsNotations',
      'rewardNotations',
      'formula',
      'totalStakedRewardsFormula',
      'totalPendingRewardsFormula',
      'bucketPendingRewardsFormula',
      'timeDiffFormula',
      'parentRewardFormula',
      'sponsorDepositFormula',
      'sponsorStakedTokensFormula',
      'downstreamRewardsFormula',
      'recipientPendingRewardsFormula',
      'agentPendingRewardsFormula',
      'sponsorPendingRewardsFormula',
    ],
    existingRewardsFormula,
  );
  moveFields(
    [
      'Note',
      'note',
      'yearSeconds',
      'secondsInYear',
      'rateUnit',
      'solidityMethod',
      'soliditySource',
      'bucketLastUpdateTimeStamp',
      'sponsorBucketLastUpdateTimeStamp',
      'recipientBucketLastUpdateTimeStamp',
      'agentBucketLastUpdateTimeStamp',
      'calculatedTimeStamp',
      'calculatedTimeDiff',
      'TimeDiffFormatted',
      'bucketLastUpdateFormatted',
      'sponsorBucketLastUpdateFormatted',
      'recipientBucketLastUpdateFormatted',
      'agentBucketLastUpdateFormatted',
      'calculatedFormatted',
      'pendingRoleRewards',
      'pendingSponsorRewards',
      'pendingRecipientRewards',
      'pendingAgentRewards',
      'pendingTotalRewards',
      'totalRewards',
      'exactClaimedAmountFormula',
      'exactClaimedAmountSource',
      'balanceBefore',
      'balanceAfter',
      'claimedAmount',
      'settlementTimestamp',
      'accountSnapshotBefore',
      'accountSnapshotAfter',
    ],
    existingRewardFormulsValues,
  );
  delete next.rewardsFormula;
  delete next.rewardFormulsValues;
  next.rewardFormulas = compactRewardFormulaGroup(existingRewardsFormula, next.role);
  if (next.rewardFormulas && typeof next.rewardFormulas === 'object' && !Array.isArray(next.rewardFormulas)) {
    const compactRewardsFormula = next.rewardFormulas as Record<string, unknown>;
    delete compactRewardsFormula.rewardsFormula;
    delete compactRewardsFormula.rewardFormulas;
    const compactRewardNotations = compactRewardsFormula.rewardNotations ?? compactRewardsFormula.rewardsNotations;
    if (compactRewardNotations && typeof compactRewardNotations === 'object') {
      next.rewardNotations = compactRewardNotations;
      delete compactRewardsFormula.rewardNotations;
      delete compactRewardsFormula.rewardsNotations;
    }
    const compactRewardValues = compactRewardsFormula.rewardValues ?? compactRewardsFormula.rewardFormulsValues;
    if (compactRewardValues && typeof compactRewardValues === 'object') {
      next.rewardValues = compactRewardValues;
      delete compactRewardsFormula.rewardValues;
      delete compactRewardsFormula.rewardFormulsValues;
    }
  }
  if (Object.keys(existingRewardFormulsValues).length > 0) {
    if (
      Object.prototype.hasOwnProperty.call(existingRewardFormulsValues, 'note') &&
      !Object.prototype.hasOwnProperty.call(existingRewardFormulsValues, 'Note')
    ) {
      existingRewardFormulsValues.Note = existingRewardFormulsValues.note;
    }
    if (
      !Object.prototype.hasOwnProperty.call(existingRewardFormulsValues, 'role') &&
      Object.prototype.hasOwnProperty.call(next, 'role')
    ) {
      existingRewardFormulsValues.role = next.role;
    }
    delete existingRewardFormulsValues.note;
    delete existingRewardFormulsValues.secondsInYesr;
    delete existingRewardFormulsValues.yearSeconds;
    delete existingRewardFormulsValues.rateUnit;
    delete existingRewardFormulsValues.lastSponsorUpdate;
    delete existingRewardFormulsValues.lastRecipientUpdate;
    delete existingRewardFormulsValues.lastAgentUpdate;
    delete existingRewardFormulsValues.lastSponsorTimeStamp;
    delete existingRewardFormulsValues.lastRecipientTimeStamp;
    delete existingRewardFormulsValues.lastAgentTimeStamp;
    delete existingRewardFormulsValues.timeDifference;
    delete existingRewardFormulsValues.timeDifferenceMS;
    delete existingRewardFormulsValues.formattedDifference;
    delete existingRewardFormulsValues.pendingRewards;
    const bucketTimestamp =
      existingRewardFormulsValues.sponsorBucketLastUpdateTimeStamp ??
      existingRewardFormulsValues.recipientBucketLastUpdateTimeStamp ??
      existingRewardFormulsValues.agentBucketLastUpdateTimeStamp;
    if (
      bucketTimestamp !== undefined &&
      existingRewardFormulsValues.calculatedTimeStamp !== undefined &&
      !Object.prototype.hasOwnProperty.call(existingRewardFormulsValues, 'calculatedTimeDiff')
    ) {
      existingRewardFormulsValues.calculatedTimeDiff = calculateDisplayTimeDiffSeconds(
        bucketTimestamp,
        existingRewardFormulsValues.calculatedTimeStamp,
      );
    }
    if (
      existingRewardFormulsValues.calculatedTimeDiff !== undefined &&
      !Object.prototype.hasOwnProperty.call(existingRewardFormulsValues, 'TimeDiffFormatted')
    ) {
      existingRewardFormulsValues.TimeDiffFormatted = formatDisplayTimeDiffSeconds(
        existingRewardFormulsValues.calculatedTimeDiff,
      );
    }
    const normalizedRole = String(next.role || '').trim();
    const rolePendingRewardKey =
      normalizedRole === 'Sponsor'
        ? 'pendingSponsorRewards'
        : normalizedRole === 'Recipient'
          ? 'pendingRecipientRewards'
          : normalizedRole === 'Agent'
            ? 'pendingAgentRewards'
            : '';
    if (
      rolePendingRewardKey &&
      existingRewardFormulsValues.pendingRoleRewards !== undefined &&
      (!existingRewardFormulsValues[rolePendingRewardKey] ||
        String(existingRewardFormulsValues[rolePendingRewardKey]) === '0')
    ) {
      existingRewardFormulsValues[rolePendingRewardKey] = existingRewardFormulsValues.pendingRoleRewards;
    }
    delete existingRewardFormulsValues.pendingRoleRewards;
    delete existingRewardFormulsValues.totalRewards;
    if (normalizedRole === 'Sponsor') {
      delete existingRewardFormulsValues.pendingRecipientRewards;
      delete existingRewardFormulsValues.pendingAgentRewards;
    } else if (normalizedRole === 'Recipient') {
      delete existingRewardFormulsValues.pendingSponsorRewards;
      delete existingRewardFormulsValues.pendingAgentRewards;
    } else if (normalizedRole === 'Agent') {
      delete existingRewardFormulsValues.pendingSponsorRewards;
      delete existingRewardFormulsValues.pendingRecipientRewards;
    }
    if (
      Object.prototype.hasOwnProperty.call(existingRewardFormulsValues, 'bucketLastUpdateTimeStamp') &&
      !Object.prototype.hasOwnProperty.call(existingRewardFormulsValues, 'sponsorBucketLastUpdateTimeStamp')
    ) {
      existingRewardFormulsValues.sponsorBucketLastUpdateTimeStamp =
        existingRewardFormulsValues.bucketLastUpdateTimeStamp;
    }
    if (
      Object.prototype.hasOwnProperty.call(existingRewardFormulsValues, 'bucketLastUpdateFormatted') &&
      !Object.prototype.hasOwnProperty.call(existingRewardFormulsValues, 'sponsorBucketLastUpdateFormatted')
    ) {
      existingRewardFormulsValues.sponsorBucketLastUpdateFormatted =
        existingRewardFormulsValues.bucketLastUpdateFormatted;
    }
    delete existingRewardFormulsValues.bucketLastUpdateTimeStamp;
    delete existingRewardFormulsValues.bucketLastUpdateFormatted;
    const normalizedRewardFormulsValues = normalizeRewardFormulsValuesDisplayShape(
      existingRewardFormulsValues,
      normalizedRole,
    );
    const compactRewardsFormula =
      next.rewardFormulas && typeof next.rewardFormulas === 'object' && !Array.isArray(next.rewardFormulas)
        ? { ...(next.rewardFormulas as Record<string, unknown>) }
        : {};
    delete compactRewardsFormula.rewardsFormula;
    delete compactRewardsFormula.rewardFormulas;
    next.rewardFormulas = compactRewardsFormula;
    next.rewardValues = {
      ...(Object.prototype.hasOwnProperty.call(normalizedRewardFormulsValues, 'Note')
        ? { Note: normalizedRewardFormulsValues.Note }
        : {}),
      ...normalizedRewardFormulsValues,
    };
  }
  return next;
  const applyCurrentRewardFormulas = () => {
    next.indexNotation =
      next.indexNotation ??
      't = sponsor/rate bucket index; r = recipient-rate bucket index; a = agent-rate bucket index; yearSeconds = 31556925 seconds = 365.2421875 days';
    next.totalPendingRewardsFormula =
      next.totalPendingRewardsFormula ?? 'grossSponsorPendingRewards = Σ_t sponsorBucketPendingRewards[t]';
    next.bucketPendingRewardsFormula =
      next.bucketPendingRewardsFormula ??
      'sponsorBucketPendingRewards[t] = floor((sponsorBucketTimeDiffSeconds[t] * sponsorBucketStakedQuantity[t] * sponsorBucketRate[t]) / 100 / yearSeconds)';
    next.timeDiffFormula =
      next.timeDiffFormula ??
      'sponsorBucketTimeDiffSeconds[t] = max(0, settlementTimestamp - sponsorBucketLastUpdateTimeStamp[t])';
    next.downstreamRewardsFormula =
      next.downstreamRewardsFormula ?? 'downstreamPendingRewards = recipientPendingRewards + agentPendingRewards';
    next.recipientPendingRewardsFormula =
      next.recipientPendingRewardsFormula ??
      'recipientPendingRewards = Σ_r recipientBucketPendingRewards[r]';
    next.agentPendingRewardsFormula =
      next.agentPendingRewardsFormula ??
      'agentPendingRewards = Σ_a agentBucketPendingRewards[a]';
    next.sponsorPendingRewardsFormula =
      next.sponsorPendingRewardsFormula ?? 'netSponsorPendingRewards = grossSponsorPendingRewards - downstreamPendingRewards';
  };

  if (Object.prototype.hasOwnProperty.call(next, 'formula')) {
    applyCurrentRewardFormulas();
    delete next.formula;
  }
  if (Object.prototype.hasOwnProperty.call(next, 'totalStakedRewardsFormula')) {
    applyCurrentRewardFormulas();
    delete next.totalStakedRewardsFormula;
  }
  if (Object.prototype.hasOwnProperty.call(next, 'parentRewardFormula')) {
    applyCurrentRewardFormulas();
    delete next.parentRewardFormula;
  }
  if (Object.prototype.hasOwnProperty.call(next, 'sponsorDepositFormula')) {
    applyCurrentRewardFormulas();
    delete next.sponsorDepositFormula;
  }
  if (Object.prototype.hasOwnProperty.call(next, 'sponsorStakedTokensFormula')) {
    applyCurrentRewardFormulas();
    delete next.sponsorStakedTokensFormula;
  }
  return next;
}

function shouldHideByDropdownRules(
  value: unknown,
  showAll: boolean,
  hiddenRules: NonNullable<JsonInspectorProps['hiddenRules']>,
  showStructureType: boolean,
): boolean {
  if (showAll) return false;
  if (value && typeof value === 'object' && !Array.isArray(value)) return false;
  return !hasPopulatedContent(value, hiddenRules, showStructureType);
}

function getAccountRecordEntryOrder(key: string): number {
  const order: Record<string, number> = {
    sponsorCount: 10,
    recipientCount: 11,
    agentCount: 12,
    parentRecipientCount: 13,
    lastSponsorUpdateTimeStamp: 20,
    lastRecipientUpdateTimeStamp: 21,
    lastAgentUpdateTimeStamp: 22,
    rewardsEarned: 30,
    stakingRewards: 31,
    totalSpCoins: 40,
    pendingRewards: 41,
    recipientKeys: 50,
    agentKeys: 51,
    sponsorKeys: 52,
    parentRecipientKeys: 53,
    recipientRates: 60,
    agentRates: 61,
  };
  return order[key] ?? 100;
}

function getTotalSpCoinsEntryOrder(key: string): number {
  const order: Record<string, number> = {
    balanceOf: 10,
    stakedBalance: 11,
  };
  return order[key] ?? 100;
}

function getVisibleEntries(
  value: any,
  showAll: boolean,
  hiddenRules: NonNullable<JsonInspectorProps['hiddenRules']>,
  hideEntryKeys: string[] = [],
  forceShowEntryKeys: string[] = [],
  showStructureType = false,
  accountRoleCounts: AccountRoleCounts | null = null,
  label?: string,
  path?: string,
): Array<[string, any]> {
  const sortEntries = ([leftKey]: [string, any], [rightKey]: [string, any]) => {
    const displayRecord =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
    const isAccountRecord = displayRecord?.TYPE === '--ACCOUNT--';
    if (isAccountRecord) {
      const leftOrder = getAccountRecordEntryOrder(leftKey);
      const rightOrder = getAccountRecordEntryOrder(rightKey);
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    }
    if (isTotalSpCoinsRecord(value)) {
      const leftOrder = getTotalSpCoinsEntryOrder(leftKey);
      const rightOrder = getTotalSpCoinsEntryOrder(rightKey);
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    }
    if (leftKey === 'meta' && rightKey !== 'meta') return -1;
    if (rightKey === 'meta' && leftKey !== 'meta') return 1;
    if (leftKey === 'source' && rightKey !== 'source') return -1;
    if (rightKey === 'source' && leftKey !== 'source') return 1;
    if (leftKey === 'role' && rightKey !== 'source' && rightKey !== 'role') return -1;
    if (rightKey === 'role' && leftKey !== 'source' && leftKey !== 'role') return 1;
    const rewardCalculationOrder: Record<string, number> = {
      rewardNotations: 10,
      rewardFormulas: 11,
      rewardValues: 12,
    };
    const leftRewardCalculationOrder = rewardCalculationOrder[leftKey];
    const rightRewardCalculationOrder = rewardCalculationOrder[rightKey];
    if (leftRewardCalculationOrder !== undefined || rightRewardCalculationOrder !== undefined) {
      return (leftRewardCalculationOrder ?? 100) - (rightRewardCalculationOrder ?? 100);
    }
    if (
      (leftKey === 'onChainCalls' || leftKey === 'methodOnChainCalls' || leftKey === 'totalMethodsOnChainMs') &&
      rightKey !== 'onChainCalls' &&
      rightKey !== 'methodOnChainCalls' &&
      rightKey !== 'totalMethodsOnChainMs'
    ) return 1;
    if (
      (rightKey === 'onChainCalls' || rightKey === 'methodOnChainCalls' || rightKey === 'totalMethodsOnChainMs') &&
      leftKey !== 'onChainCalls' &&
      leftKey !== 'methodOnChainCalls' &&
      leftKey !== 'totalMethodsOnChainMs'
    ) return -1;
    if (leftKey === 'totalOnChainMs' && rightKey !== 'totalOnChainMs') return 1;
    if (rightKey === 'totalOnChainMs' && leftKey !== 'totalOnChainMs') return -1;
    if (leftKey === 'claim' && rightKey === 'update') return -1;
    if (leftKey === 'update' && rightKey === 'claim') return 1;
    if ((leftKey === 'claim' || leftKey === 'update') && rightKey === 'pendingRewards') return -1;
    if (rightKey === 'pendingRewards' && (leftKey === 'claim' || leftKey === 'update')) return 1;
    if (leftKey === 'totalGasUsed' && rightKey !== 'totalGasUsed') return 1;
    if (rightKey === 'totalGasUsed' && leftKey !== 'totalGasUsed') return -1;
    if (leftKey === 'totalGasPriceWei' && rightKey !== 'totalGasPriceWei') return 1;
    if (rightKey === 'totalGasPriceWei' && leftKey !== 'totalGasPriceWei') return -1;
    if (leftKey === 'totalFeePaidWei' && rightKey !== 'totalFeePaidWei') return 1;
    if (rightKey === 'totalFeePaidWei' && leftKey !== 'totalFeePaidWei') return -1;
    if (leftKey === 'totalFeePaidEth' && rightKey !== 'totalFeePaidEth') return 1;
    if (rightKey === 'totalFeePaidEth' && leftKey !== 'totalFeePaidEth') return -1;
    const leftIsNumericIndex = /^\d+$/.test(String(leftKey));
    const rightIsNumericIndex = /^\d+$/.test(String(rightKey));
    if (leftIsNumericIndex === rightIsNumericIndex) return 0;
    return leftIsNumericIndex ? 1 : -1;
  };

  if (!value || typeof value !== 'object') return [];
  if (isPendingRewardsIncludedMethodNode(value)) return [];
  const normalizedValue = normalizePendingRewardsDisplayResult(value);
  const displayValueBeforeAccountShape =
    normalizedValue && typeof normalizedValue === 'object' && !Array.isArray(normalizedValue)
      ? addPendingRewardsTimingToStepResult(moveAccountUpdateTimestampsToMeta(normalizedValue))
      : addPendingRewardsTimingToStepResult(value);
  const isRefreshedAccountRecordNode =
    String(path || '').split('.').includes('refreshedAccountRecord') ||
    String(label || '').startsWith('refreshedAccountRecord');
  const displayValue = normalizeRewardCalculationDisplayShape(
    normalizeAccountRecordDisplayShape(
      stripRedundantPendingRewardResultFields(displayValueBeforeAccountShape, path),
      { suppressPendingRewardsLift: isRefreshedAccountRecordNode },
    ),
    accountRoleCounts,
    label,
  );
  const shouldDropRefreshedAccountPendingRewards = (childKey: string) => {
    const shouldDrop =
      childKey === 'pendingRewards' &&
      (isRefreshedAccountRecordNode ||
        (String(path || '').includes('claimOnChain') &&
          displayValue &&
          typeof displayValue === 'object' &&
          !Array.isArray(displayValue) &&
          (displayValue as Record<string, unknown>).TYPE === '--ACCOUNT--'));
    return shouldDrop;
  };
  const shouldDropPendingRewardsClaimResultArtifact = (childKey: string) =>
    (childKey === 'recipientKeys' || childKey === 'receipts') &&
    String(path || '').includes('claimOnChain') &&
    (String(path || '').split('.').includes('result') || String(label || '').startsWith('result'));
  const forceShowChildren = shouldShowEmptyChildren(displayValue);
  if (showAll || forceShowChildren) {
    if (Array.isArray(displayValue)) {
      return displayValue.map((entry, index) => [String(index), entry] as [string, any]);
    }
    const entries = Object.entries(displayValue)
      .map(([childKey, childValue]) => normalizeVisibleEntry(displayValue, childKey, childValue))
      .filter(
        ([childKey, childValue]) =>
          childKey !== 'address' &&
          !shouldHideByDropdownRules(childValue, showAll || forceShowChildren, hiddenRules, showStructureType) &&
          !(isLazyAccountRelationNode(childValue) && getLazyAccountRelationCount(childValue) <= 0) &&
          childKey !== '__lazySpCoinMetaData' &&
          childKey !== '__lazyMasterAccountKeys' &&
          childKey !== '__lazyAccountRelation' &&
          childKey !== '__pendingRewardsRefreshAction' &&
          childKey !== '__pendingRewardsRefreshAtMs' &&
          childKey !== '__pendingRewardsRefreshActionName' &&
          childKey !== '__lazyPendingRewardsMethod' &&
          childKey !== '__forceExpanded' &&
          childKey !== '__showEmptyFields' &&
          childKey !== 'annualInflationRate' &&
          childKey !== 'role(s)' &&
          !shouldDropRefreshedAccountPendingRewards(childKey) &&
          !shouldDropPendingRewardsClaimResultArtifact(childKey) &&
          !(childKey === 'parameters' && typeof (displayValue as Record<string, unknown>).call === 'object') &&
          childKey !== 'accountKey' &&
          !isRedundantLastClaimedRewardsField(childKey) &&
          childKey !== 'relation' &&
          childKey !== 'count' &&
          childKey !== 'method' &&
          childKey !== 'action' &&
          !isPendingRewardsContainerSummaryField(displayValue, childKey) &&
          !isAccountRoleCountDisplayField(displayValue, childKey) &&
          !(isTotalSpCoinsRecord(displayValue) && (childKey === 'claim' || childKey === 'update' || childKey === 'mode')) &&
          !(
            isTotalSpCoinsRecord(displayValue) &&
            (displayValue as Record<string, unknown>).TYPE !== '--ACCOUNT--' &&
            childKey === 'totalSpCoins'
          ) &&
          !(isPendingRewardsRecord(displayValue) && (childKey === 'claim' || childKey === 'estimate' || childKey === 'mode')) &&
          !isPendingRewardsTotalActionField(displayValue, childKey) &&
          !isPendingRewardsInternalField(displayValue, childKey) &&
          !hideEntryKeys.includes(childKey) &&
          (showStructureType || childKey !== 'TYPE'),
      )
      .sort(sortEntries);
    return shouldInjectPendingRewardsMethodEntries(label, path, displayValue)
      ? filterPendingRewardsRoleEntries(
          ensurePendingRewardsMethodEntries(entries),
          accountRoleCounts,
        )
      : entries;
  }

  if (Array.isArray(displayValue)) {
    return displayValue
      .map((entry, index) => [String(index), entry] as [string, any])
      .filter(([, entry]) => {
        if (!entry || typeof entry !== 'object') return true;
        return hasPopulatedContent(entry, hiddenRules, showStructureType);
      });
  }

  const entries = Object.entries(displayValue)
    .map(([childKey, childValue]) => normalizeVisibleEntry(displayValue, childKey, childValue))
    .filter(([childKey, childValue]) => {
      if (childKey === 'address') return false;
      if (shouldHideByDropdownRules(childValue, showAll, hiddenRules, showStructureType)) return false;
      if (isLazyAccountRelationNode(childValue) && getLazyAccountRelationCount(childValue) <= 0) return false;
      if (childKey === '__lazySpCoinMetaData') return false;
      if (childKey === '__lazyMasterAccountKeys') return false;
      if (childKey === '__lazyAccountRelation') return false;
      if (childKey === '__pendingRewardsRefreshAction') return false;
      if (childKey === '__pendingRewardsRefreshAtMs') return false;
      if (childKey === '__pendingRewardsRefreshActionName') return false;
      if (childKey === '__lazyPendingRewardsMethod') return false;
      if (childKey === '__forceExpanded') return false;
      if (childKey === '__showEmptyFields') return false;
      if (childKey === 'annualInflationRate') return false;
      if (childKey === 'role(s)') return false;
      if (shouldDropRefreshedAccountPendingRewards(childKey)) return false;
      if (shouldDropPendingRewardsClaimResultArtifact(childKey)) return false;
      if (childKey === 'parameters' && displayValue && typeof displayValue === 'object' && !Array.isArray(displayValue) && typeof (displayValue as Record<string, unknown>).call === 'object') return false;
      if (isLazyAccountRelationNode(displayValue) && ['accountKey', 'relation', 'count', 'method'].includes(childKey)) return false;
      if (isPendingRewardsContainerSummaryField(displayValue, childKey)) return false;
      if (isAccountRoleCountDisplayField(displayValue, childKey)) return false;
      if (isTotalSpCoinsRecord(displayValue) && (childKey === 'claim' || childKey === 'update' || childKey === 'mode')) return false;
      if (
        isTotalSpCoinsRecord(displayValue) &&
        (displayValue as Record<string, unknown>).TYPE !== '--ACCOUNT--' &&
        childKey === 'totalSpCoins'
      ) return false;
      if (isPendingRewardsRecord(displayValue) && (childKey === 'claim' || childKey === 'estimate' || childKey === 'mode')) return false;
      if (isPendingRewardsTotalActionField(displayValue, childKey)) return false;
      if (isPendingRewardsInternalField(displayValue, childKey)) return false;
      if (hideEntryKeys.includes(childKey)) return false;
      if (isTotalSpCoinsPendingRewards(displayValue, childKey, childValue)) return true;
      if (forceShowEntryKeys.includes(childKey)) return true;
      if (!showStructureType && childKey === 'TYPE') return false;
      if (!childValue || typeof childValue !== 'object') return hasPopulatedContent(childValue, hiddenRules, showStructureType);
      return hasPopulatedContent(childValue, hiddenRules, showStructureType);
    })
    .sort(sortEntries);
  return shouldInjectPendingRewardsMethodEntries(label, path, displayValue)
    ? filterPendingRewardsRoleEntries(
        ensurePendingRewardsMethodEntries(entries),
        accountRoleCounts,
      )
    : entries;
}

const JsonInspector: React.FC<JsonInspectorProps> = ({
  data,
  collapsedKeys,
  updateCollapsedKeys,
  level = 0,
  path = 'root',
  rootLabel = 'Exchange Context',
  label,
  highlightPathPrefixes = [],
  highlightColorClass = 'text-green-400',
  showAll = true,
  hiddenRules = {
    zeroValues: true,
    emptyValues: true,
    falseValues: true,
    todoValues: true,
    emptyCollections: true,
    creationDates: true,
    formattedAmounts: false,
  },
  onLeafValueClick,
  onAddressNodeClick,
  onTrace,
  hideEntryKeys = [],
  forceShowEntryKeys = [],
  formatTokenAmounts = false,
  tokenDecimals = null,
  showStructureType = false,
  accountRoleCounts = null,
  scriptStepDragState,
}) => {
  const effectiveAccountRoleCounts = getAccountRoleCounts(data) ?? accountRoleCounts;
  const effectiveHideEntryKeys = [...hideEntryKeys];
  if (
    label &&
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    typeof (data as Record<string, unknown>).accountKey === 'string' &&
    (hasInlineAccountRecord(data) || isLazyAccountRelationNode(data) || isPendingRewardsIncludedMethodNode(data)) &&
    !effectiveHideEntryKeys.includes('accountKey')
  ) {
    effectiveHideEntryKeys.push('accountKey');
  }
  const visibleEntries = getVisibleEntries(
    data,
    showAll,
    hiddenRules,
    effectiveHideEntryKeys,
    forceShowEntryKeys,
    showStructureType,
    effectiveAccountRoleCounts,
    label,
    path,
  );
  const addressNode =
    data && typeof data === 'object' && !Array.isArray(data)
      ? String((data as Record<string, unknown>).address || (data as Record<string, unknown>).accountKey || '').trim()
      : '';
  const isPendingRewardsResultSummaryLabel = String(label || '').startsWith('result: ');
  const isAddressNode = !isPendingRewardsResultSummaryLabel && /^0x[0-9a-fA-F]{40}$/.test(addressNode);
  const isAddressFieldBackedNode =
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    typeof (data as Record<string, unknown>).address === 'string';
  const hasLoadedAccountRecord = isAddressNode && hasInlineAccountRecord(data);
  const isLazyAddressStub = isAddressNode && isAddressFieldBackedNode && !hasLoadedAccountRecord && visibleEntries.length === 0;
  const isLazySpCoinMetaData = isLazySpCoinMetaDataNode(data);
  const isLazyMasterAccountKeys = isLazyMasterAccountKeysNode(data);
  const isLazyAccountRelation = isLazyAccountRelationNode(data);
  const totalSpCoinsPendingRewardsAction = getTotalSpCoinsPendingRewardsAction(data);
  const isLazyTotalSpCoinsPendingRewards = Boolean(totalSpCoinsPendingRewardsAction);
  const refreshAtMs = getPendingRewardsRefreshAtMs(data);
  const [refreshClockMs] = useState(() => Date.now());
  const isPendingRewardsRefreshReady =
    isPendingRewardsRefreshNode(label, data) && refreshAtMs > 0 && refreshAtMs <= refreshClockMs;
  const lazyAccountRelationCount = getLazyAccountRelationCount(data);
  const lazyAccountRelationCanExpand = isLazyAccountRelation && lazyAccountRelationCount > 0;
  const shouldForceExpand = shouldForceExpandNode(data);
  const currentPath = path ?? '';
  const expandedPathKey = getExpandedPathKey(currentPath);
  const forceExpandedDismissedKey = `__force_expanded_dismissed__:${currentPath}`;
  const forceExpandedIsActive =
    shouldForceExpand && !isPendingRewardsRefreshReady && !collapsedKeys.includes(forceExpandedDismissedKey);
  const isExplicitlyExpanded = forceExpandedIsActive || collapsedKeys.includes(expandedPathKey);
  const isDefaultCollapsed = (level > 0 || /^script-header-\d+$/.test(currentPath)) && !isExplicitlyExpanded && !isLazyAccountRelation;
  const isCollapsed =
    !forceExpandedIsActive &&
    (collapsedKeys.includes(currentPath) ||
      isDefaultCollapsed ||
      isLazyAddressStub ||
      isLazySpCoinMetaData ||
      isLazyMasterAccountKeys ||
      isLazyTotalSpCoinsPendingRewards ||
      isPendingRewardsRefreshReady ||
      lazyAccountRelationCanExpand);
  const isHighlighted = highlightPathPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}.`),
  );
  const materializeBranch = useCallback(() => {
    if (isLazySpCoinMetaData) {
      onTrace?.(`[JSON_BRANCH_MATERIALIZE] kind=spcoin-metadata path=${currentPath}`);
      onLeafValueClick?.('__load_spcoin_metadata__', currentPath, 'spCoinMetaData');
      return true;
    }
    if (isLazyMasterAccountKeys) {
      onTrace?.(`[JSON_BRANCH_MATERIALIZE] kind=master-account-keys path=${currentPath}`);
      onLeafValueClick?.('__load_master_account_keys__', currentPath, 'masterAccountKeys');
      return true;
    }
    if (isLazyTotalSpCoinsPendingRewards && totalSpCoinsPendingRewardsAction) {
      onTrace?.(`[JSON_BRANCH_MATERIALIZE] kind=total-pending-rewards path=${currentPath}`);
      onLeafValueClick?.(
        JSON.stringify({
          __loadPendingRewardsAction: true,
          accountKey: String(totalSpCoinsPendingRewardsAction.accountKey || ''),
          action: String(totalSpCoinsPendingRewardsAction.action || 'estimate'),
        }),
        `${currentPath}.pendingRewards.estimateOffChainTotalRewards`,
        'estimateOffChainTotalRewards',
      );
      return true;
    }
    if (isPendingRewardsRefreshReady) {
      onTrace?.(
        `[JSON_BRANCH_MATERIALIZE] kind=pending-rewards-refresh path=${currentPath} refreshAtMs=${String(refreshAtMs)} nowMs=${String(refreshClockMs)}`,
      );
      onLeafValueClick?.(
        JSON.stringify({
          __loadPendingRewardsAction: true,
          accountKey: getPendingRewardsRefreshAccountKey(data),
          action: getPendingRewardsRefreshActionName(data),
        }),
        currentPath,
        'result',
      );
      return true;
    }
    if (isPendingRewardsIncludedMethodNode(data)) {
      onTrace?.(
        `[JSON_BRANCH_MATERIALIZE] kind=pending-rewards-method path=${currentPath} method=${String((data as Record<string, unknown>).method || label || '')}`,
      );
      onLeafValueClick?.(
        JSON.stringify({
          __loadPendingRewardsMethod: true,
          accountKey: String((data as Record<string, unknown>).accountKey || ''),
          method: String((data as Record<string, unknown>).method || label || ''),
        }),
        currentPath,
        String((data as Record<string, unknown>).method || label || ''),
      );
      return true;
    }
    if (isLazyAccountRelation) {
      if (!lazyAccountRelationCanExpand) return true;
      onTrace?.(
        `[JSON_BRANCH_MATERIALIZE] kind=account-relation path=${currentPath} relation=${String((data as Record<string, unknown>).relation || '')} count=${String(lazyAccountRelationCount)}`,
      );
      onLeafValueClick?.(
        JSON.stringify({
          __loadAccountRelation: true,
          accountKey: String((data as Record<string, unknown>).accountKey || ''),
          relation: String((data as Record<string, unknown>).relation || ''),
          count: lazyAccountRelationCount,
        }),
        currentPath,
        String((data as Record<string, unknown>).relation || ''),
      );
      return true;
    }
    if (isAddressNode && !hasLoadedAccountRecord) {
      if (isLazyAddressStub) {
        onTrace?.(`[JSON_BRANCH_MATERIALIZE] kind=address-record path=${currentPath} account=${addressNode}`);
        onLeafValueClick?.(addressNode, currentPath, 'address');
        return true;
      }
      onTrace?.(
        `[JSON_BRANCH_MATERIALIZE] kind=none-address-metadata path=${currentPath} label=${String(label || '')} account=${addressNode} reason=not-address-field-backed-lazy-stub`,
      );
      return false;
    }
    return false;
  }, [
    addressNode,
    currentPath,
    data,
    hasLoadedAccountRecord,
    isAddressNode,
    isLazyAddressStub,
    isLazyAccountRelation,
    isLazyMasterAccountKeys,
    isLazySpCoinMetaData,
    isLazyTotalSpCoinsPendingRewards,
    isPendingRewardsRefreshReady,
    label,
    lazyAccountRelationCanExpand,
    lazyAccountRelationCount,
    onLeafValueClick,
    onTrace,
    refreshAtMs,
    refreshClockMs,
    totalSpCoinsPendingRewardsAction,
  ]);

  const openBranch = useCallback((source = 'toggle') => {
    const ancestorPaths = getAncestorPaths(currentPath);
    const expandedAncestorPathKeys = getExpandedAncestorPathKeys(currentPath);
    const nextKeys = [...new Set([
      ...collapsedKeys.filter(
        (key) => key !== currentPath && key !== forceExpandedDismissedKey && !ancestorPaths.includes(key),
      ),
      ...expandedAncestorPathKeys,
      expandedPathKey,
    ])];
    onTrace?.(
      `[JSON_BRANCH_TOGGLE] action=open source=${source} path=${currentPath} label=${String(label || '')} wasCollapsed=${String(isCollapsed)} ancestors=${ancestorPaths.join('>')} nextHasPath=${String(nextKeys.includes(currentPath))} nextHasExpanded=${String(nextKeys.includes(expandedPathKey))}`,
    );
    updateCollapsedKeys(nextKeys);
    materializeBranch();
  }, [
    collapsedKeys,
    currentPath,
    expandedPathKey,
    forceExpandedDismissedKey,
    isCollapsed,
    label,
    materializeBranch,
    onTrace,
    updateCollapsedKeys,
  ]);

  const closeBranch = useCallback((source = 'toggle') => {
    const nextKeys = [
      ...new Set([...collapsedKeys.filter((key) => key !== expandedPathKey), currentPath, forceExpandedDismissedKey]),
    ];
    onTrace?.(
      `[JSON_BRANCH_TOGGLE] action=close source=${source} path=${currentPath} label=${String(label || '')} wasCollapsed=${String(isCollapsed)} nextHasPath=${String(nextKeys.includes(currentPath))} nextHasExpanded=${String(nextKeys.includes(expandedPathKey))}`,
    );
    updateCollapsedKeys(nextKeys);
  }, [
    collapsedKeys,
    currentPath,
    expandedPathKey,
    forceExpandedDismissedKey,
    isCollapsed,
    label,
    onTrace,
    updateCollapsedKeys,
  ]);

  const toggleBranch = useCallback(() => {
    if (isCollapsed) {
      openBranch('toggle');
      return;
    }
    closeBranch('toggle');
  }, [closeBranch, isCollapsed, openBranch]);

  const rerunnablePendingRewardsMethod = getPendingRewardsMethodName(label, data);
  const rerunnablePendingRewardsMethodDisplayName = rerunnablePendingRewardsMethod
    ? getPendingRewardsMethodDisplayName(rerunnablePendingRewardsMethod)
    : '';
  const refreshPendingRewardsTitle = rerunnablePendingRewardsMethod
    ? `Rerun ${rerunnablePendingRewardsMethodDisplayName}`
    : undefined;
  const refreshPendingRewardsMethod = useCallback(() => {
    const methodName = getPendingRewardsMethodName(label, data);
    if (!methodName) {
      onTrace?.(`[PENDING_REWARDS_TRACE] method label ignored reason=no-method path=${currentPath} label=${String(label || '')}`);
      return;
    }
    const accountKey = getPendingRewardsRefreshAccountKey(data);
    if (!accountKey) {
      onTrace?.(`[PENDING_REWARDS_TRACE] method label ignored reason=no-account path=${currentPath} method=${methodName}`);
      return;
    }
    const action = getPendingRewardsRefreshActionName(data);
    onTrace?.(
      `[PENDING_REWARDS_TRACE] method label dispatch path=${currentPath} method=${methodName} account=${accountKey} action=${action}`,
    );
    onLeafValueClick?.(
      JSON.stringify({
        __loadPendingRewardsMethod: true,
        accountKey,
        method: methodName,
      }),
      currentPath,
      methodName,
    );
  }, [currentPath, data, label, onLeafValueClick, onTrace]);
  const getValueColor = (value: any): string => {
    if (value === false || value === undefined || value === null) return 'text-red-500';
    if (typeof value === 'boolean') return 'text-yellow-300';
    return 'text-green-400';
  };

  const getPathLabel = (nextPath: string): string => {
    if (label && label.startsWith('onChainCalls')) return label;
    if (label && label.startsWith('childOnChainCalls')) return label;
    if (label && label.startsWith('result: ')) return label;
    if (label && PENDING_REWARDS_METHOD_NAMES.has(label)) {
      return getPendingRewardsMethodDisplayName(label);
    }
    if (label) return getAddressNodeLabel(data, label);
    if (nextPath === 'root') return rootLabel;
    if (nextPath === 'tradeData.slippage') return 'slippage';
    return getAddressNodeLabel(data, formatPathSegmentLabel(nextPath));
  };

  const getDisplayLabel = (nextPath: string): string => {
    const baseLabel = getPathLabel(nextPath);
    if (isLazyAccountRelation) return getLazyAccountRelationName(data, baseLabel);
    if (isPendingRewardsIncludedMethodNode(data)) {
      return getPendingRewardsMethodDisplayName(
        String((data as Record<string, unknown>).method || label || baseLabel).trim(),
      );
    }
    if (!label || !data || typeof data !== 'object' || Array.isArray(data)) return baseLabel;
    const record = data as Record<string, unknown>;
    const callRecord =
      record.call && typeof record.call === 'object' && !Array.isArray(record.call)
        ? (record.call as Record<string, unknown>)
        : null;
    const callMethod = String(callRecord?.method || '').trim();
    const pendingRewardsSummary = getPendingRewardsMethodSummaryValue(callMethod, record);
    if (pendingRewardsSummary) {
      return `${baseLabel}: ${formatDisplayScalar(
        pendingRewardsSummary.key,
        pendingRewardsSummary.value,
        formatTokenAmounts,
        tokenDecimals,
      )}`;
    }

    const accountRelationLabel = getAccountRelationMethodLabel(callMethod);
    if (accountRelationLabel && baseLabel === accountRelationLabel) {
      const resultCount = Array.isArray(record.result) ? record.result.length : 0;
      return `${baseLabel}[${resultCount}]`;
    }
    if (isZeroPendingRewardsPlaceholderLabel(label, data)) return baseLabel;

    const inlineSummaryValue = record[label];
    if (
      label !== 'result' &&
      inlineSummaryValue !== undefined &&
      inlineSummaryValue !== null &&
      typeof inlineSummaryValue !== 'object'
    ) {
      return `${baseLabel}: ${formatDisplayScalar(label, inlineSummaryValue, formatTokenAmounts, tokenDecimals)}`;
    }
    return baseLabel;
  };

  const lastPathSegment = String(path || '')
    .trim()
    .split('.')
    .filter(Boolean)
    .at(-1) || '';
  const draggableScriptStepNumber =
    getScriptStepNumberFromExactSegment(label || '') ??
    getScriptStepNumberFromExactSegment(lastPathSegment);
  const methodLabelScriptStepMethod =
    draggableScriptStepNumber !== null &&
    label &&
    PENDING_REWARDS_METHOD_NAMES.has(label)
      ? label
      : '';
  const stepCallRecord =
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    (data as Record<string, unknown>).call &&
    typeof (data as Record<string, unknown>).call === 'object' &&
    !Array.isArray((data as Record<string, unknown>).call)
      ? ((data as Record<string, unknown>).call as Record<string, unknown>)
      : null;
  const visibleStepLabel = methodLabelScriptStepMethod
    ? `Step ${draggableScriptStepNumber}`
    : stepCallRecord && draggableScriptStepNumber !== null
      ? `Step ${draggableScriptStepNumber}`
      : getDisplayLabel(path ?? '');
  const draggableScriptStepNumberWithLabel =
    draggableScriptStepNumber ?? getScriptStepNumberFromLabel(visibleStepLabel);
  const isDraggableScriptStep = Boolean(
    scriptStepDragState?.enabled && draggableScriptStepNumberWithLabel !== null,
  );
  const activeDropPlacement =
    scriptStepDragState?.dropTarget?.stepNumber === draggableScriptStepNumberWithLabel
      ? scriptStepDragState.dropTarget.placement
      : null;
  const inlineStepMethod =
    stepCallRecord && typeof stepCallRecord.method === 'string'
      ? String(stepCallRecord.method).trim()
      : methodLabelScriptStepMethod
        ? methodLabelScriptStepMethod
      : '';
  const isAccountRelationInlineMethod = Boolean(getAccountRelationMethodLabel(inlineStepMethod));
  const inlineStepMethodDisplayName = PENDING_REWARDS_METHOD_NAMES.has(inlineStepMethod)
    ? getPendingRewardsMethodDisplayName(inlineStepMethod)
    : inlineStepMethod;
  const inlineStepMethodParameterValue = getMethodDisplayParameterValue(inlineStepMethod, stepCallRecord);
  const inlineStepMethodAddress = isAddressText(inlineStepMethodParameterValue)
    ? inlineStepMethodParameterValue
    : isAddressNode
      ? addressNode
      : '';
  const displayPathLabel =
    stepCallRecord && draggableScriptStepNumber !== null
      ? `Step ${draggableScriptStepNumber}`
      : getDisplayLabel(path ?? '');
  const pendingRewardsMethodSummary = getPendingRewardsMethodSummaryValue(inlineStepMethod, data);
  const pendingRewardsMethodResultSummary = getPendingRewardsMethodResultSummaryValue(inlineStepMethod, data);
  const pendingRewardsMethodSummaryDisplay = pendingRewardsMethodSummary
    ? formatDisplayScalar(
        pendingRewardsMethodSummary.key,
        pendingRewardsMethodSummary.value,
        formatTokenAmounts,
        tokenDecimals,
      )
    : '';
  const pendingRewardsMethodResultSummaryDisplay = pendingRewardsMethodResultSummary
    ? `${formatDisplayScalar(
        pendingRewardsMethodResultSummary.key,
        pendingRewardsMethodResultSummary.value,
        formatTokenAmounts,
        tokenDecimals,
      )} ${pendingRewardsMethodResultSummary.suffix}`
    : '';
  const hasPendingRewardsMethodSummary = Boolean(pendingRewardsMethodSummary);
  const visibleInlineStepMethod =
    (hasPendingRewardsMethodSummary && !isDraggableScriptStep) ||
    isAccountRelationInlineMethod ||
    inlineStepMethod === visibleStepLabel ||
    inlineStepMethod === displayPathLabel ||
    inlineStepMethodDisplayName === visibleStepLabel ||
    inlineStepMethodDisplayName === displayPathLabel
      ? ''
      : inlineStepMethodDisplayName;
  const showStepAddressAfterMethod = Boolean(inlineStepMethodAddress && stepCallRecord && visibleInlineStepMethod);
  const promotedStepEntries =
    stepCallRecord && !Array.isArray(stepCallRecord)
      ? [
          ...(stepCallRecord.parameters !== undefined && !hideEntryKeys.includes('parameters')
            ? ([['parameters', stepCallRecord.parameters]] as Array<[string, any]>)
            : []),
          ...visibleEntries.filter(([key]) => key !== 'call'),
        ]
      : visibleEntries;
  const beginScriptStepDrag = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!isDraggableScriptStep || !scriptStepDragState) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('button')) return;
      event.preventDefault();
      event.stopPropagation();
      if (draggableScriptStepNumberWithLabel !== null) {
        scriptStepDragState.beginDrag(draggableScriptStepNumberWithLabel);
      }
    },
    [draggableScriptStepNumberWithLabel, isDraggableScriptStep, scriptStepDragState],
  );
  const handleScriptStepDoubleClick = useCallback((event?: React.MouseEvent<HTMLElement>) => {
    const target = event?.target as HTMLElement | null;
    if (target?.closest('button')) return;
    if (!isDraggableScriptStep || !scriptStepDragState?.onStepDoubleClick || draggableScriptStepNumberWithLabel === null) return;
    scriptStepDragState.onStepDoubleClick(draggableScriptStepNumberWithLabel, inlineStepMethod);
  }, [draggableScriptStepNumberWithLabel, inlineStepMethod, isDraggableScriptStep, scriptStepDragState]);

  const handleScriptStepLabelClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (!isDraggableScriptStep || !scriptStepDragState?.onStepDoubleClick || draggableScriptStepNumberWithLabel === null) return;
      scriptStepDragState.onStepDoubleClick(draggableScriptStepNumberWithLabel, inlineStepMethod);
    },
    [draggableScriptStepNumberWithLabel, inlineStepMethod, isDraggableScriptStep, scriptStepDragState],
  );

  const handleScriptStepMethodClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (!isDraggableScriptStep || !scriptStepDragState?.onStepMethodClick || draggableScriptStepNumberWithLabel === null) return;
      scriptStepDragState.onStepMethodClick(draggableScriptStepNumberWithLabel, inlineStepMethod);
    },
    [draggableScriptStepNumberWithLabel, inlineStepMethod, isDraggableScriptStep, scriptStepDragState],
  );

  const renderValue = (value: any, key: string) => {
    const nextPath = getDisplayEntryPath(path ?? '', data, key, value);
    const effectiveKey =
      key === 'calls' && String(path || '').endsWith('.onChainCalls') && Array.isArray(value)
        ? (() => {
            const totalMs = (value as unknown[]).reduce((sum: number, entry: unknown) => {
              const ms = Number(String((entry as Record<string, unknown>)?.onChainRunTimeMs ?? '0').replace(/,/g, ''));
              return sum + (Number.isFinite(ms) ? ms : 0);
            }, 0);
            return `onChainCalls: ${totalMs}ms`;
          })()
        : key === 'onChainCalls' && Array.isArray(value)
          ? (() => {
              const totalMs = (value as unknown[]).reduce((sum: number, entry: unknown) => {
                const ms = Number(String((entry as Record<string, unknown>)?.onChainRunTimeMs ?? '0').replace(/,/g, ''));
                return sum + (Number.isFinite(ms) ? ms : 0);
              }, 0);
              return `onChainCalls: ${totalMs}ms`;
            })()
        : key === 'childOnChainCalls' && String(path || '').endsWith('.onChainCalls') && Array.isArray(value)
          ? (() => {
              const totalMs = (value as unknown[]).reduce((sum: number, entry: unknown) => {
                const ms = Number(String((entry as Record<string, unknown>)?.totalOnChainMs ?? '0').replace(/,/g, ''));
                return sum + (Number.isFinite(ms) ? ms : 0);
              }, 0);
              return `childOnChainCalls: ${totalMs}ms`;
            })()
        : key === 'result' && pendingRewardsMethodResultSummaryDisplay
          ? `result: ${pendingRewardsMethodResultSummaryDisplay}`
          : key;
    if (key === 'creationTime' || key === 'creationDate' || key === 'Date Created') {
      if (!showAll && hiddenRules.creationDates) return null;
      const normalizedDate = normalizeLegacyDateDisplay(value);
      if (normalizedDate) {
        const valueHighlighted = highlightPathPrefixes.some(
          (prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}.`),
        );
        return (
          <div key={nextPath} className="ml-4 whitespace-nowrap">
            <span className={valueHighlighted ? highlightColorClass : 'text-[#5981F3]'}>{key}</span>: <span className={valueHighlighted ? highlightColorClass : 'text-green-400'}>"{normalizedDate}"</span>
          </div>
        );
      }
    }
    if (isRewardUpdateTimestampKey(key) && value && typeof value === 'object') {
      const normalizedDate = normalizeLegacyDateDisplay(value);
      if (normalizedDate) {
        const valueHighlighted = highlightPathPrefixes.some(
          (prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}.`),
        );
        return (
          <div key={nextPath} className="ml-4 whitespace-nowrap">
            <span className={valueHighlighted ? highlightColorClass : 'text-[#5981F3]'}>{key}</span>: <span className={valueHighlighted ? highlightColorClass : 'text-green-400'}>"{normalizedDate}"</span>
          </div>
        );
      }
    }

    if (value && typeof value === 'object') {
      const forceRenderObject =
        isTotalSpCoinsPendingRewards(data, key, value) ||
        (key === 'totalSpCoins' && isTotalSpCoinsRecord(value)) ||
        isPendingRewardsIncludedMethodNode(value);
      if (
        !forceRenderObject &&
        !forceShowEntryKeys.includes(key) &&
        !hasVisibleDescendants(value, showAll, hiddenRules, showStructureType)
      ) {
        return null;
      }
      return (
        <JsonInspector
          key={nextPath}
          data={value}
          collapsedKeys={collapsedKeys}
          updateCollapsedKeys={updateCollapsedKeys}
          level={level + 1}
          path={nextPath}
          rootLabel={rootLabel}
          label={effectiveKey}
          hideEntryKeys={
            key === 'totalOnChainMs'
              ? [...hideEntryKeys, 'totalOnChainMs']
              : key === 'totalMethodsOnChainMs'
                ? [...hideEntryKeys, 'totalMethodsOnChainMs']
                : key === 'methodOnChainCalls'
                  ? [...hideEntryKeys, 'methodOnChainCalls']
                : hideEntryKeys
          }
          highlightPathPrefixes={highlightPathPrefixes}
          highlightColorClass={highlightColorClass}
          showAll={showAll}
          hiddenRules={hiddenRules}
          onLeafValueClick={onLeafValueClick}
          onAddressNodeClick={onAddressNodeClick}
          onTrace={onTrace}
          formatTokenAmounts={formatTokenAmounts}
          tokenDecimals={tokenDecimals}
          showStructureType={showStructureType}
          accountRoleCounts={effectiveAccountRoleCounts}
          scriptStepDragState={scriptStepDragState}
        />
      );
    }

    const valueHighlighted = highlightPathPrefixes.some(
      (prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}.`),
    );
    const scalarDisplayValue = formatDisplayScalar(key, value, formatTokenAmounts, tokenDecimals);
    const isRewardFormulaEntry =
      key !== 'indexNotation' &&
      key !== 'rewardsNotations' &&
      key !== 'rewardNotations' &&
      (String(path || '').endsWith('.rewardFormulas') ||
        String(path || '').endsWith('.rewardsFormula') ||
        label === 'rewardFormulas' ||
        label === 'rewardsFormula' ||
        isCompactRewardFormulaDisplayGroup(data));
    const scalarDelimiter = isRewardFormulaEntry ? '=' : ':';
    const scalarDelimiterText = scalarDelimiter === '=' ? ' = ' : ': ';
    const rawStringValue = typeof value === 'string' ? value.trim() : '';
    const isClickableAddress = /^0x[0-9a-fA-F]{40}$/.test(rawStringValue);
    const isArrayIndexAddress = isClickableAddress && /^\d+$/.test(String(key || ''));
    return (
      <div key={nextPath} className="ml-4 whitespace-nowrap">
        {isClickableAddress ? (
          <span
            className={
              isArrayIndexAddress
                ? 'inline-grid grid-cols-[1.55rem_1.2rem_auto] items-baseline whitespace-nowrap gap-x-1'
                : 'inline-grid grid-cols-[auto_auto] items-baseline whitespace-nowrap gap-x-1'
            }
          >
            {isArrayIndexAddress && typeof onLeafValueClick === 'function' ? (
              <button
                type="button"
                className={`w-full bg-transparent p-0 text-left font-mono ${valueHighlighted ? highlightColorClass : 'text-green-400'}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onTrace?.(`[JSON_INSPECTOR_TRACE] array address expand click path=${nextPath} key=${key} value=${rawStringValue}`);
                  updateCollapsedKeys([
                    ...new Set([
                      ...collapsedKeys.filter((collapsedKey) => collapsedKey !== nextPath),
                      getExpandedPathKey(nextPath),
                    ]),
                  ]);
                  onLeafValueClick(rawStringValue, nextPath, key);
                }}
                title={`Open account record ${rawStringValue}`}
              >
                [+]
              </button>
            ) : null}
            <span className={`${isArrayIndexAddress ? 'text-right' : ''} ${valueHighlighted ? highlightColorClass : 'text-[#5981F3]'}`}>
              {key}{scalarDelimiter}
            </span>
            {typeof onAddressNodeClick === 'function' ? (
              <button
                type="button"
                className={`font-mono underline decoration-dotted underline-offset-2 transition-colors cursor-pointer hover:text-white focus:outline-none bg-transparent p-0 ${
                  valueHighlighted ? highlightColorClass : getValueColor(value)
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  onTrace?.(`[JSON_INSPECTOR_TRACE] scalar address click path=${nextPath} key=${key} value=${rawStringValue}`);
                  onAddressNodeClick(rawStringValue, nextPath, key);
                }}
                title={`Show metadata for ${rawStringValue}`}
              >
                {renderFormulaDisplayValue(scalarDisplayValue)}
              </button>
            ) : (
              <span
                className={`font-mono underline decoration-dotted underline-offset-2 transition-colors ${
                  valueHighlighted ? highlightColorClass : getValueColor(value)
                }`}
                title={`Show metadata for ${rawStringValue}`}
              >
                {renderFormulaDisplayValue(scalarDisplayValue)}
              </span>
            )}
          </span>
        ) : (
          <>
            <span className={valueHighlighted ? highlightColorClass : 'text-[#5981F3]'}>{key}</span>
            {scalarDelimiterText}
            <span className={valueHighlighted ? highlightColorClass : getValueColor(value)}>
              {renderFormulaDisplayValue(scalarDisplayValue)}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`${level > 0 ? 'ml-2' : ''} font-mono leading-tight`}>
      <div
        data-script-step-number={isDraggableScriptStep ? String(draggableScriptStepNumberWithLabel) : undefined}
        data-script-step-label={visibleStepLabel}
        data-script-step-path={path}
        data-script-step-draggable={isDraggableScriptStep ? 'true' : 'false'}
        onMouseDown={beginScriptStepDrag}
        onDoubleClick={handleScriptStepDoubleClick}
        style={isDraggableScriptStep ? { cursor: 'grab' } : undefined}
        className={`whitespace-nowrap rounded-sm ${isDraggableScriptStep ? 'cursor-pointer select-none' : ''}`}
      >
        <div className={`mb-[2px] h-[2px] rounded-full ${activeDropPlacement === 'before' ? 'bg-[#8FA8FF]' : 'bg-transparent'}`} />
        <button
          type="button"
          className="inline-flex items-center bg-transparent p-0"
          onClick={(event) => {
            event.stopPropagation();
            toggleBranch();
          }}
          title={undefined}
        >
          <span className={isHighlighted ? highlightColorClass : isCollapsed ? 'text-green-400' : 'text-red-400'}>{isCollapsed ? '[+]' : '[-]'}</span>
        </button>{' '}
        {isLazyAccountRelation ? (
          <button
            type="button"
            className={`inline-flex bg-transparent p-0 text-left font-semibold underline decoration-dotted underline-offset-2 transition-colors focus:outline-none ${
              lazyAccountRelationCanExpand ? 'cursor-pointer hover:text-white' : 'cursor-default'
            } ${isHighlighted ? highlightColorClass : 'text-white'}`}
            onClick={(event) => {
              event.stopPropagation();
              onTrace?.(
                `[JSON_INSPECTOR_TRACE] relation node click path=${path ?? ''} relation=${String((data as Record<string, unknown>).relation || '')} count=${String(lazyAccountRelationCount)}`,
              );
              if (lazyAccountRelationCanExpand) {
                openBranch('label');
              }
            }}
            title={
              lazyAccountRelationCanExpand
                ? `Load ${getLazyAccountRelationName(data, visibleStepLabel)}`
                : `${getLazyAccountRelationName(data, visibleStepLabel)} has no entries`
            }
          >
            {getDisplayLabel(path ?? '')}
          </button>
        ) : isDraggableScriptStep && scriptStepDragState?.onStepDoubleClick && draggableScriptStepNumberWithLabel !== null ? (
          <button
            type="button"
            className={`inline-flex bg-transparent p-0 text-left font-semibold underline-offset-2 transition-colors hover:text-white focus:outline-none ${
              scriptStepDragState?.draggedStepNumber === draggableScriptStepNumberWithLabel ? 'opacity-70' : ''
            } ${isHighlighted ? highlightColorClass : 'text-white'}`}
            onClick={handleScriptStepLabelClick}
            title={`Step ${draggableScriptStepNumberWithLabel} actions`}
          >
            {renderDisplayLabelWithStatusSuffix(visibleStepLabel)}
          </button>
        ) : rerunnablePendingRewardsMethod ? (
          <>
            <button
              type="button"
              className={`inline-flex bg-transparent p-0 text-left font-semibold underline decoration-dotted underline-offset-2 transition-colors hover:text-white focus:outline-none ${
                isHighlighted ? highlightColorClass : 'text-white'
              }`}
              onClick={(event) => {
                event.stopPropagation();
                onTrace?.(
                  `[PENDING_REWARDS_TRACE] method label click path=${path ?? ''} method=${rerunnablePendingRewardsMethod} hasSummary=${String(hasPendingRewardsMethodSummary)}`,
                );
                if (
                  isDraggableScriptStep &&
                  scriptStepDragState?.onStepMethodClick &&
                  draggableScriptStepNumberWithLabel !== null
                ) {
                  scriptStepDragState.onStepMethodClick(draggableScriptStepNumberWithLabel, rerunnablePendingRewardsMethod);
                  return;
                }
                refreshPendingRewardsMethod();
              }}
              title={
                isDraggableScriptStep && scriptStepDragState?.onStepMethodClick
                  ? `Rerun ${rerunnablePendingRewardsMethodDisplayName}`
                  : refreshPendingRewardsTitle
              }
            >
              {hasPendingRewardsMethodSummary ? `${rerunnablePendingRewardsMethodDisplayName}:` : getDisplayLabel(path ?? '')}
            </button>
            {hasPendingRewardsMethodSummary ? (
              <>
                {' '}
                {isAddressText(String(pendingRewardsMethodSummary?.value ?? '')) && typeof onAddressNodeClick === 'function' ? (
                  (() => {
                    const summary = pendingRewardsMethodSummary;
                    if (!summary) return null;
                    return (
                      <button
                        type="button"
                        className={`inline-flex bg-transparent p-0 text-left font-semibold underline decoration-dotted underline-offset-2 transition-colors hover:text-white focus:outline-none ${
                          isHighlighted ? highlightColorClass : 'text-green-400'
                        }`}
                        onClick={(event) => {
                          const accountValue = String(summary.value ?? '').trim();
                          event.stopPropagation();
                          onTrace?.(
                            `[JSON_INSPECTOR_TRACE] pending rewards method address click path=${path ?? ''} method=${rerunnablePendingRewardsMethod} value=${accountValue}`,
                          );
                          onAddressNodeClick(accountValue, path ?? '', summary.key);
                        }}
                        title={`Show metadata for ${String(summary.value ?? '').trim()}`}
                      >
                        {formatDisplayScalar(
                          summary.key,
                          summary.value,
                          formatTokenAmounts,
                          tokenDecimals,
                        )}
                      </button>
                    );
                  })()
                ) : (
                  <span className={isHighlighted ? highlightColorClass : 'text-green-400'}>
                    {pendingRewardsMethodSummaryDisplay}
                  </span>
                )}
              </>
            ) : null}
          </>
        ) : isAddressNode && !showStepAddressAfterMethod && (typeof onAddressNodeClick === 'function' || isLazyAddressStub) ? (
          <>
            <span className={`font-semibold ${isHighlighted ? highlightColorClass : 'text-white'}`}>
              {(() => {
                const displayLabel = getDisplayLabel(path ?? '');
                const addressSuffix = `: "${addressNode}"`;
                return displayLabel.endsWith(addressSuffix)
                  ? displayLabel.slice(0, -addressSuffix.length)
                  : displayLabel;
              })()}
              :{' '}
            </span>
            <button
              type="button"
              className={`inline-flex bg-transparent p-0 text-left font-semibold underline decoration-dotted underline-offset-2 transition-colors hover:text-white focus:outline-none ${
                isHighlighted ? highlightColorClass : 'text-white'
              }`}
              onClick={(event) => {
                event.stopPropagation();
                onTrace?.(
                  `[JSON_INSPECTOR_TRACE] address node click path=${path ?? ''} key=${label || 'address'} value=${addressNode} lazy=${String(isLazyAddressStub)} loaded=${String(hasLoadedAccountRecord)}`,
                );
                if (isLazyAddressStub) {
                  openBranch('label');
                  return;
                }
                onAddressNodeClick?.(addressNode, path ?? '', label || 'address');
              }}
              title={isLazyAddressStub ? `Open account record ${addressNode}` : `Show metadata for ${addressNode}`}
            >
              "{addressNode}"
            </button>
          </>
        ) : isPendingRewardsRefreshNode(label, data) ? (
          <button
            type="button"
            className={`inline-flex bg-transparent p-0 text-left font-semibold underline decoration-dotted underline-offset-2 transition-colors hover:text-white focus:outline-none ${
              isHighlighted ? highlightColorClass : 'text-white'
            }`}
            onClick={(event) => {
              event.stopPropagation();
              onTrace?.(
                `[JSON_INSPECTOR_TRACE] pendingRewards label refresh click path=${path ?? ''} refreshAtMs=${String(refreshAtMs)} nowMs=${String(refreshClockMs)} accountKey=${getPendingRewardsRefreshAccountKey(data)}`,
              );
              onLeafValueClick?.(
                JSON.stringify({
                  __loadPendingRewardsAction: true,
                  accountKey: getPendingRewardsRefreshAccountKey(data),
                  action: getPendingRewardsRefreshActionName(data),
                }),
                path ?? '',
                'pendingRewards',
              );
            }}
            title="Refresh pending rewards estimate"
          >
            {renderDisplayLabelWithStatusSuffix(visibleStepLabel)}
          </button>
        ) : (
          <span
            style={isDraggableScriptStep ? { cursor: 'grab' } : undefined}
            className={`font-semibold ${isDraggableScriptStep ? 'cursor-pointer select-none active:cursor-grabbing' : ''} ${
              scriptStepDragState?.draggedStepNumber === draggableScriptStepNumberWithLabel ? 'opacity-70' : ''
            } ${isHighlighted ? highlightColorClass : 'text-white'}`}
            title={isDraggableScriptStep ? 'Drag to reorder this step' : undefined}
          >
            {renderDisplayLabelWithStatusSuffix(visibleStepLabel)}
          </span>
        )}
        {visibleInlineStepMethod ? (
          isDraggableScriptStep && scriptStepDragState?.onStepMethodClick && draggableScriptStepNumberWithLabel !== null ? (
            <button
              type="button"
              className={`ml-3 inline-flex bg-transparent p-0 text-left font-semibold transition-colors hover:text-white focus:outline-none ${
                isHighlighted ? highlightColorClass : 'text-green-400'
              }`}
              onClick={handleScriptStepMethodClick}
              title={`Rerun ${visibleInlineStepMethod}`}
            >
              {visibleInlineStepMethod}
            </button>
          ) : (
            <span className={`ml-3 ${isHighlighted ? highlightColorClass : 'text-green-400'}`}>
              {visibleInlineStepMethod}
            </span>
          )
        ) : null}
        {showStepAddressAfterMethod ? (
          <>
            {' '}
            {typeof onAddressNodeClick === 'function' ? (
              <button
                type="button"
                className={`inline-flex bg-transparent p-0 text-left font-semibold underline decoration-dotted underline-offset-2 transition-colors hover:text-white focus:outline-none ${
                  isHighlighted ? highlightColorClass : 'text-white'
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  onTrace?.(
                    `[JSON_INSPECTOR_TRACE] step address click path=${path ?? ''} key=${label || 'address'} value=${inlineStepMethodAddress}`,
                  );
                  onAddressNodeClick(inlineStepMethodAddress, path ?? '', label || 'address');
                }}
                title={`Show metadata for ${inlineStepMethodAddress}`}
              >
                "{inlineStepMethodAddress}"
              </button>
            ) : (
              <span className={`font-semibold ${isHighlighted ? highlightColorClass : 'text-white'}`}>"{inlineStepMethodAddress}"</span>
            )}
          </>
        ) : null}
        <div className={`mt-[2px] h-[2px] rounded-full ${activeDropPlacement === 'after' ? 'bg-[#8FA8FF]' : 'bg-transparent'}`} />
      </div>
      {!isCollapsed && <div className="ml-4">{promotedStepEntries.map(([key, value]) => renderValue(value, key))}</div>}
    </div>
  );
};

export default JsonInspector;
