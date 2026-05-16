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

function getPendingRewardsMethodDisplayName(methodName: string): string {
  return PENDING_REWARDS_METHOD_DISPLAY_NAMES[methodName] || methodName;
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
  };
}

type AccountRoleCounts = {
  sponsorCount: number;
  recipientCount: number;
  agentCount: number;
  parentRecipientCount: number;
};

function parseCountValue(value: unknown): number {
  const normalized = String(value ?? '0').replace(/,/g, '').trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getAccountRoleCounts(data: any): AccountRoleCounts | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  const hasCount =
    Object.prototype.hasOwnProperty.call(record, 'sponsorCount') ||
    Object.prototype.hasOwnProperty.call(record, 'recipientCount') ||
    Object.prototype.hasOwnProperty.call(record, 'agentCount') ||
    Object.prototype.hasOwnProperty.call(record, 'parentRecipientCount');
  if (!hasCount) return null;
  return {
    sponsorCount: parseCountValue(record.sponsorCount),
    recipientCount: parseCountValue(record.recipientCount),
    agentCount: parseCountValue(record.agentCount),
    parentRecipientCount: parseCountValue(record.parentRecipientCount),
  };
}

function hasRoleCountForPendingRewardsKey(key: string, counts: AccountRoleCounts | null | undefined): boolean {
  const normalizedKey = String(key || '').trim();
  if (/^update.*AccountRewards$/.test(normalizedKey) || /^get.*PendingRewards$/.test(normalizedKey)) {
    return false;
  }
  const isSponsor = counts ? counts.recipientCount > 0 : true;
  const isRecipient = counts ? counts.sponsorCount > 0 || counts.agentCount > 0 : true;
  const isAgent = counts ? counts.parentRecipientCount > 0 : true;
  if (!counts) return true;
  if (/SponsorRewards$/.test(normalizedKey) || normalizedKey === 'pendingSponsorRewards') {
    return isSponsor;
  }
  if (/RecipientRewards$/.test(normalizedKey) || normalizedKey === 'pendingRecipientRewards') {
    return isRecipient;
  }
  if (/AgentRewards$/.test(normalizedKey) || normalizedKey === 'pendingAgentRewards') {
    return isAgent;
  }
  return true;
}

function getScriptStepNumberFromPath(path: string): number | null {
  const normalizedPath = String(path || '').trim();
  const indexedMatch = normalizedPath.match(/(?:^|\.)(?:steps\.(\d+)|step-(\d+)|script-(\d+))$/);
  if (!indexedMatch) return null;
  const rawStepNumber = indexedMatch[1] ?? indexedMatch[2] ?? indexedMatch[3];
  if (rawStepNumber == null) return null;
  const parsed = Number(rawStepNumber);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed + 1 : null;
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

function getAddressNodeLabel(data: any, fallbackLabel: string): string {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return fallbackLabel;
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

function formatTimestampDateDisplay(value: unknown): string | null {
  const raw = String(value ?? '').replace(/,/g, '').trim();
  if (!raw || raw === '0') return 'N/A';
  if (!/^\d+$/.test(raw)) return normalizeLegacyDateDisplay(value);
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) return 'N/A';
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) return null;
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hour24 = date.getHours();
  const hour12 = hour24 % 12 || 12;
  const minute = String(date.getMinutes()).padStart(2, '0');
  const meridiem = hour24 < 12 ? 'a.m.' : 'p.m.';
  const timeZone =
    date
      .toLocaleTimeString('en-US', { timeZoneName: 'short' })
      .split(' ')
      .pop() || '';
  return `${month}-${day}-${year}, ${hour12}:${minute} ${meridiem}${timeZone ? ` ${timeZone}` : ''}`;
}

function isRewardUpdateTimestampKey(key: string): boolean {
  return /^(lastSponsorUpdate|lastRecipientUpdate|lastAgentUpdate|lastSponsorUpdateTimeStamp|lastRecipientUpdateTimeStamp|lastAgentUpdateTimeStamp)$/i.test(
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

function normalizeAccountRecordDisplayShape(value: any): any {
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
    nestedPendingRewards !== undefined && !Object.prototype.hasOwnProperty.call(record, 'pendingRewards');

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
    'totalRewards',
    'totalRewardsClaimed',
    'sponsorRewardsClaimed',
    'recipientRewardsClaimed',
    'agentRewardsClaimed',
    'totalBalanceOf',
    'totalStakingRewards',
    'totalStakedSPCoins',
    'amount',
  ].includes(String(key || '').trim());
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
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  const result =
    record.result && typeof record.result === 'object' && !Array.isArray(record.result)
      ? (record.result as Record<string, unknown>)
      : null;
  if (!result) return null;

  if (methodName.startsWith('estimateOffChain') && methodName.endsWith('Rewards')) {
    const value = result.pendingTotalRewards ?? result.pendingRewards ?? result.totalRewards;
    return value === undefined || value === null ? null : { key: 'pendingTotalRewards', value };
  }

  if (methodName.startsWith('claimOnChain') && methodName.endsWith('Rewards')) {
    const value = result.totalRewardsClaimed ?? result.claimedAmount;
    return value === undefined || value === null ? null : { key: 'totalRewardsClaimed', value };
  }

  return null;
}

function normalizeVisibleEntry(parent: any, childKey: string, childValue: any): [string, any] {
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
  const displayValue = normalizeAccountRecordDisplayShape(displayValueBeforeAccountShape);
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
          !shouldHideByDropdownRules(childValue, showAll, hiddenRules, showStructureType) &&
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
          !(childKey === 'parameters' && typeof (displayValue as Record<string, unknown>).call === 'object') &&
          childKey !== 'accountKey' &&
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
    return isPendingRewardsRecord(displayValue)
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
  return isPendingRewardsRecord(displayValue)
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
  );
  const addressNode =
    data && typeof data === 'object' && !Array.isArray(data)
      ? String((data as Record<string, unknown>).address || (data as Record<string, unknown>).accountKey || '').trim()
      : '';
  const isAddressNode = /^0x[0-9a-fA-F]{40}$/.test(addressNode);
  const hasLoadedAccountRecord = isAddressNode && hasInlineAccountRecord(data);
  const isLazyAddressStub = isAddressNode && !hasLoadedAccountRecord && visibleEntries.length === 0;
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
  const toggle = useCallback(() => {
    onTrace?.(
      `[JSON_INSPECTOR_TRACE] toggle path=${currentPath} collapsed=${String(isCollapsed)} addressNode=${String(isAddressNode)} lazyAddress=${String(isLazyAddressStub)} loaded=${String(hasLoadedAccountRecord)} lazyMeta=${String(isLazySpCoinMetaData)} lazyMasterKeys=${String(isLazyMasterAccountKeys)} lazyRelation=${String(isLazyAccountRelation)} relationCount=${String(lazyAccountRelationCount)} pendingRefreshReady=${String(isPendingRewardsRefreshReady)} refreshAtMs=${String(refreshAtMs)} nowMs=${String(refreshClockMs)} label=${String(label || '')}`,
    );
    const nextOpenKeys = [
      ...collapsedKeys.filter((key) => key !== currentPath && key !== forceExpandedDismissedKey),
      expandedPathKey,
    ];
    if (isCollapsed && isLazySpCoinMetaData) {
      updateCollapsedKeys([...new Set(nextOpenKeys)]);
      onLeafValueClick?.('__load_spcoin_metadata__', currentPath, 'spCoinMetaData');
      return;
    }
    if (isCollapsed && isLazyMasterAccountKeys) {
      updateCollapsedKeys([...new Set(nextOpenKeys)]);
      onLeafValueClick?.('__load_master_account_keys__', currentPath, 'masterAccountKeys');
      return;
    }
    if (isCollapsed && isLazyTotalSpCoinsPendingRewards && totalSpCoinsPendingRewardsAction) {
      updateCollapsedKeys([...new Set(nextOpenKeys)]);
      onLeafValueClick?.(
        JSON.stringify({
          __loadPendingRewardsAction: true,
          accountKey: String(totalSpCoinsPendingRewardsAction.accountKey || ''),
          action: String(totalSpCoinsPendingRewardsAction.action || 'estimate'),
        }),
        `${currentPath}.pendingRewards.estimateOffChainTotalRewards`,
        'estimateOffChainTotalRewards',
      );
      return;
    }
    if (isCollapsed && isPendingRewardsRefreshReady) {
      updateCollapsedKeys([
        ...new Set([
          ...collapsedKeys.filter((key) => key !== currentPath && key !== forceExpandedDismissedKey),
          expandedPathKey,
        ]),
      ]);
      onLeafValueClick?.(
        JSON.stringify({
          __loadPendingRewardsAction: true,
          accountKey: getPendingRewardsRefreshAccountKey(data),
          action: getPendingRewardsRefreshActionName(data),
        }),
        currentPath,
        'result',
      );
      return;
    }
    if (isPendingRewardsIncludedMethodNode(data)) {
      const record = data as Record<string, unknown>;
      onTrace?.(
        `[PENDING_REWARDS_TRACE] inspector pending method toggle path=${currentPath} label=${String(label || '')} collapsed=${String(isCollapsed)} keys=${Object.keys(record).join(',')} method=${String(record.method || label || '')} accountKey=${String(record.accountKey || '')} included=${String(record.__pendingRewardsIncludedMethod === true)} lazy=${String(record.__lazyPendingRewardsMethod === true)} hasCall=${String(record.call !== undefined)} hasResult=${String(record.result !== undefined)} hasMeta=${String(record.meta !== undefined)} expandedKey=${expandedPathKey}`,
      );
      if (!isCollapsed) {
        updateCollapsedKeys([
          ...new Set([...collapsedKeys.filter((key) => key !== expandedPathKey), currentPath, forceExpandedDismissedKey]),
        ]);
        return;
      }
      updateCollapsedKeys([...new Set(nextOpenKeys)]);
      onLeafValueClick?.(
        JSON.stringify({
          __loadPendingRewardsMethod: true,
          accountKey: String((data as Record<string, unknown>).accountKey || ''),
          method: String((data as Record<string, unknown>).method || label || ''),
        }),
        currentPath,
        String((data as Record<string, unknown>).method || label || ''),
      );
      return;
    }
    if (isLazyAccountRelation) {
      if (!lazyAccountRelationCanExpand) return;
      if (isCollapsed) {
        updateCollapsedKeys([...new Set(nextOpenKeys)]);
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
      }
      return;
    }
    if (isCollapsed && isAddressNode && !hasLoadedAccountRecord) {
      updateCollapsedKeys([...new Set(nextOpenKeys)]);
      onLeafValueClick?.(addressNode, currentPath, 'address');
      return;
    }
    updateCollapsedKeys(
      isCollapsed
        ? [...new Set(nextOpenKeys)]
        : [...new Set([...collapsedKeys.filter((key) => key !== expandedPathKey), currentPath, forceExpandedDismissedKey])],
    );
  }, [
    addressNode,
    collapsedKeys,
    currentPath,
    expandedPathKey,
    forceExpandedDismissedKey,
    hasLoadedAccountRecord,
    isAddressNode,
    isCollapsed,
    data,
    isLazySpCoinMetaData,
    isLazyMasterAccountKeys,
    isLazyAccountRelation,
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
    updateCollapsedKeys,
  ]);

  const rerunnablePendingRewardsMethod = getPendingRewardsMethodName(label, data);
  const rerunnablePendingRewardsMethodDisplayName = rerunnablePendingRewardsMethod
    ? getPendingRewardsMethodDisplayName(rerunnablePendingRewardsMethod)
    : '';
  const refreshPendingRewardsTitle = rerunnablePendingRewardsMethod
    ? `Rerun ${rerunnablePendingRewardsMethodDisplayName}`
    : undefined;
  const refreshPendingRewardsMethod = useCallback(() => {
    const methodName = getPendingRewardsMethodName(label, data);
    if (!methodName) return;
    const accountKey = getPendingRewardsRefreshAccountKey(data);
    const action = getPendingRewardsRefreshActionName(data);
    onTrace?.(
      `[JSON_INSPECTOR_TRACE] pendingRewards method rerun path=${currentPath} method=${methodName} accountKey=${accountKey} action=${action}`,
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

  const visibleStepLabel = getDisplayLabel(path ?? '');
  const lastPathSegment = String(path || '')
    .trim()
    .split('.')
    .filter(Boolean)
    .at(-1) || '';
  const draggableScriptStepNumber =
    getScriptStepNumberFromExactSegment(label || '') ??
    getScriptStepNumberFromExactSegment(lastPathSegment) ??
    getScriptStepNumberFromLabel(label || '') ??
    getScriptStepNumberFromLabel(visibleStepLabel) ??
    getScriptStepNumberFromPath(path);
  const isDraggableScriptStep = Boolean(
    scriptStepDragState?.enabled && draggableScriptStepNumber !== null,
  );
  const activeDropPlacement =
    scriptStepDragState?.dropTarget?.stepNumber === draggableScriptStepNumber
      ? scriptStepDragState.dropTarget.placement
      : null;
  const stepCallRecord =
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    (data as Record<string, unknown>).call &&
    typeof (data as Record<string, unknown>).call === 'object' &&
    !Array.isArray((data as Record<string, unknown>).call)
      ? ((data as Record<string, unknown>).call as Record<string, unknown>)
      : null;
  const inlineStepMethod =
    stepCallRecord && typeof stepCallRecord.method === 'string'
      ? String(stepCallRecord.method).trim()
      : '';
  const isAccountRelationInlineMethod = Boolean(getAccountRelationMethodLabel(inlineStepMethod));
  const inlineStepMethodDisplayName = getPendingRewardsMethodDisplayName(inlineStepMethod);
  const displayPathLabel = getDisplayLabel(path ?? '');
  const pendingRewardsMethodSummary = getPendingRewardsMethodSummaryValue(inlineStepMethod, data);
  const pendingRewardsMethodSummaryDisplay = pendingRewardsMethodSummary
    ? formatDisplayScalar(
        pendingRewardsMethodSummary.key,
        pendingRewardsMethodSummary.value,
        formatTokenAmounts,
        tokenDecimals,
      )
    : '';
  const hasPendingRewardsMethodSummary = Boolean(pendingRewardsMethodSummary);
  const visibleInlineStepMethod =
    hasPendingRewardsMethodSummary ||
    isAccountRelationInlineMethod ||
    inlineStepMethod === visibleStepLabel ||
    inlineStepMethod === displayPathLabel ||
    inlineStepMethodDisplayName === visibleStepLabel ||
    inlineStepMethodDisplayName === displayPathLabel
      ? ''
      : inlineStepMethodDisplayName;
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
      if (draggableScriptStepNumber !== null) {
        scriptStepDragState.beginDrag(draggableScriptStepNumber);
      }
    },
    [draggableScriptStepNumber, isDraggableScriptStep, scriptStepDragState],
  );
  const handleScriptStepDoubleClick = useCallback(() => {
    if (!isDraggableScriptStep || !scriptStepDragState?.onStepDoubleClick || draggableScriptStepNumber === null) return;
    scriptStepDragState.onStepDoubleClick(draggableScriptStepNumber, inlineStepMethod);
  }, [draggableScriptStepNumber, inlineStepMethod, isDraggableScriptStep, scriptStepDragState]);

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
    const displayValue = formatDisplayScalar(key, value, formatTokenAmounts, tokenDecimals);
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
              {key}:
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
                {displayValue}
              </button>
            ) : (
              <span
                className={`font-mono underline decoration-dotted underline-offset-2 transition-colors ${
                  valueHighlighted ? highlightColorClass : getValueColor(value)
                }`}
                title={`Show metadata for ${rawStringValue}`}
              >
                {displayValue}
              </span>
            )}
          </span>
        ) : (
          <>
            <span className={valueHighlighted ? highlightColorClass : 'text-[#5981F3]'}>{key}</span>:{' '}
            <span className={valueHighlighted ? highlightColorClass : getValueColor(value)}>{displayValue}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`${level > 0 ? 'ml-2' : ''} font-mono leading-tight`}>
      <div
        data-script-step-number={isDraggableScriptStep ? String(draggableScriptStepNumber) : undefined}
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
          onClick={toggle}
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
                toggle();
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
        ) : rerunnablePendingRewardsMethod ? (
          <>
            <button
              type="button"
              className={`inline-flex bg-transparent p-0 text-left font-semibold underline decoration-dotted underline-offset-2 transition-colors hover:text-white focus:outline-none ${
                isHighlighted ? highlightColorClass : 'text-white'
              }`}
              onClick={(event) => {
                event.stopPropagation();
                refreshPendingRewardsMethod();
              }}
              title={refreshPendingRewardsTitle}
            >
              {hasPendingRewardsMethodSummary ? `${rerunnablePendingRewardsMethodDisplayName}:` : getDisplayLabel(path ?? '')}
            </button>
            {hasPendingRewardsMethodSummary ? (
              <>
                {' '}
                <span className={isHighlighted ? highlightColorClass : 'text-green-400'}>
                  {pendingRewardsMethodSummaryDisplay}
                </span>
              </>
            ) : null}
          </>
        ) : isAddressNode && (typeof onAddressNodeClick === 'function' || isLazyAddressStub) ? (
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
                  toggle();
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
            {visibleStepLabel}
          </button>
        ) : (
          <span
            style={isDraggableScriptStep ? { cursor: 'grab' } : undefined}
            className={`font-semibold ${isDraggableScriptStep ? 'cursor-pointer select-none active:cursor-grabbing' : ''} ${
              scriptStepDragState?.draggedStepNumber === draggableScriptStepNumber ? 'opacity-70' : ''
            } ${isHighlighted ? highlightColorClass : 'text-white'}`}
            title={isDraggableScriptStep ? 'Drag to reorder this step' : undefined}
          >
            {visibleStepLabel}
          </span>
        )}
        {visibleInlineStepMethod ? (
          <span className={`ml-3 ${isHighlighted ? highlightColorClass : 'text-green-400'}`}>
            {formatDisplayScalar('method', visibleInlineStepMethod, false, tokenDecimals)}
          </span>
        ) : null}
        <div className={`mt-[2px] h-[2px] rounded-full ${activeDropPlacement === 'after' ? 'bg-[#8FA8FF]' : 'bg-transparent'}`} />
      </div>
      {!isCollapsed && <div className="ml-4">{promotedStepEntries.map(([key, value]) => renderValue(value, key))}</div>}
    </div>
  );
};

export default JsonInspector;
