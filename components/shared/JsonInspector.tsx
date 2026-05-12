'use client';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import React, { useCallback, useState } from 'react';

const PENDING_REWARDS_REFRESH_MS = 10_000;

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
  lockPendingRewardsMode?: boolean;
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
  return Boolean(
    record &&
      (record.TYPE === '--PENDING_REWARDS--' || record.TYPE === '--ACCOUNT_PENDING_REWARDS--') &&
      Object.prototype.hasOwnProperty.call(record, 'pendingRewards'),
  );
}

function isTotalSpCoinsPendingRewards(parent: any, childKey: string, childValue: any): boolean {
  return childKey === 'pendingRewards' && isTotalSpCoinsRecord(parent) && isPendingRewardsRecord(childValue);
}

function isLazyPendingRewardsActionNode(data: any): boolean {
  return Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      (data as Record<string, unknown>).__lazyPendingRewardsAction === true,
  );
}

function getTotalSpCoinsPendingRewardsAction(_data: any): Record<string, unknown> | null {
  return null;
}

function getPendingRewardsRunAction(data: any): Record<string, unknown> | null {
  if (!isPendingRewardsRecord(data)) return null;
  const record = data as Record<string, unknown>;
  const runPendingRewards = record.runPendingRewards;
  if (runPendingRewards && typeof runPendingRewards === 'object' && !Array.isArray(runPendingRewards)) return null;
  const estimate = record.estimate;
  if (isLazyPendingRewardsActionNode(estimate)) return estimate as Record<string, unknown>;
  const claim = record.claim;
  return isLazyPendingRewardsActionNode(claim) ? (claim as Record<string, unknown>) : null;
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
  const directAccount = String(record.accountKey || '').trim();
  if (directAccount) return directAccount;
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
  const directAction = String(record.__pendingRewardsRefreshActionName || '').trim();
  if (directAction) return directAction;
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

function getPendingRewardsActionName(data: any, fallback: string): string {
  if (!isLazyPendingRewardsActionNode(data)) return fallback;
  const fallbackLabel = String(fallback || '').trim();
  const record = data as Record<string, unknown>;
  if (fallbackLabel === 'mode' || fallbackLabel === 'claim' || fallbackLabel === 'estimate' || fallbackLabel === 'claimPendingRewards' || fallbackLabel === 'updatePendingRewards') {
    const overrideLabel = String(record.__pendingRewardsModeLabel ?? '').trim();
    if (overrideLabel) return `mode: ${overrideLabel}`;
    const action = String(record.action ?? fallbackLabel).trim();
    if (fallbackLabel === 'claimPendingRewards') return 'claimPendingRewards';
    if (fallbackLabel === 'updatePendingRewards') return 'updatePendingRewards';
    return `mode: ${action}`;
  }
  if (/\b(off-chain|on-chain)\b/i.test(fallbackLabel)) return fallback;
  const action = String(record.action || fallback).trim();
  return action || fallback;
}

function getPendingRewardsModeAction(value: any): Record<string, unknown> | null {
  if (isLazyPendingRewardsActionNode(value)) return value as Record<string, unknown>;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const directAction = String((value as Record<string, unknown>).action ?? '').trim();
  const directAccountKey = String((value as Record<string, unknown>).accountKey ?? '').trim();
  if ((directAction === 'claim' || directAction === 'estimate') && directAccountKey) {
    const record = value as Record<string, unknown>;
    return {
      ...record,
      __lazyPendingRewardsAction: true,
      __pendingRewardsModeLabel:
        String(record.__pendingRewardsModeLabel ?? '').trim() ||
        (directAction === 'claim' ? 'claim - on-chain' : 'estimate - off-chain'),
      __pendingRewardsModeValue:
        String(record.__pendingRewardsModeValue ?? '').trim() ||
        (directAction === 'claim' ? directAccountKey : 'selected'),
    };
  }
  const entries = Object.entries(value as Record<string, unknown>);
  const lazyEntry = entries.find(([, entryValue]) => isLazyPendingRewardsActionNode(entryValue));
  if (!lazyEntry) return null;
  const [modeLabel, modeAction] = lazyEntry;
  const record = modeAction as Record<string, unknown>;
  return {
    ...record,
    __pendingRewardsModeLabel: String(record.__pendingRewardsModeLabel ?? modeLabel).trim(),
    __pendingRewardsModeValue: String(record.__pendingRewardsModeValue ?? record.accountKey ?? '').trim(),
  };
}

function normalizePendingRewardsModeEntries(entries: Array<[string, any]>): Array<[string, any]> {
  return entries.map(([key, value]) => {
    if (key !== 'mode') return [key, value];
    const modeAction = getPendingRewardsModeAction(value);
    return modeAction ? [key, modeAction] : [key, value];
  });
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

function getVisibleEntries(
  value: any,
  showAll: boolean,
  hiddenRules: NonNullable<JsonInspectorProps['hiddenRules']>,
  hideEntryKeys: string[] = [],
  forceShowEntryKeys: string[] = [],
  showStructureType = false,
): Array<[string, any]> {
  const sortEntries = ([leftKey]: [string, any], [rightKey]: [string, any]) => {
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
    if (leftKey === 'annualInflationRate' && rightKey === 'pendingRewards') return -1;
    if (rightKey === 'annualInflationRate' && leftKey === 'pendingRewards') return 1;
    if (leftKey === 'annualInflationRate' && (rightKey === 'claim' || rightKey === 'update')) return -1;
    if ((leftKey === 'claim' || leftKey === 'update') && rightKey === 'annualInflationRate') return 1;
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
  const forceShowChildren = shouldShowEmptyChildren(value);
  if (showAll || forceShowChildren) {
    if (Array.isArray(value)) {
      return value.map((entry, index) => [String(index), entry] as [string, any]);
    }
    const entries = Object.entries(value)
      .filter(
        ([childKey]) =>
          childKey !== 'address' &&
          childKey !== '__lazySpCoinMetaData' &&
          childKey !== '__lazyMasterAccountKeys' &&
          childKey !== '__lazyAccountRelation' &&
          childKey !== '__lazyPendingRewardsAction' &&
          childKey !== '__pendingRewardsRefreshAction' &&
          childKey !== '__pendingRewardsRefreshAtMs' &&
          childKey !== '__pendingRewardsRefreshActionName' &&
          childKey !== '__pendingRewardsModeLabel' &&
          childKey !== '__pendingRewardsModeValue' &&
          childKey !== '__forceExpanded' &&
          childKey !== '__showEmptyFields' &&
          !(childKey === 'parameters' && typeof (value as Record<string, unknown>).call === 'object') &&
          childKey !== 'accountKey' &&
          childKey !== 'relation' &&
          childKey !== 'count' &&
          childKey !== 'method' &&
          childKey !== 'action' &&
          !(isPendingRewardsRecord(value) && (childKey === 'claim' || childKey === 'estimate')) &&
          !isPendingRewardsInternalField(value, childKey) &&
          !hideEntryKeys.includes(childKey) &&
          (showStructureType || childKey !== 'TYPE'),
      )
      .sort(sortEntries);
    const normalizedEntries = normalizePendingRewardsModeEntries(entries);
    const runAction = getPendingRewardsRunAction(value);
    if (runAction) return [['runPendingRewards', runAction], ...normalizedEntries] as Array<[string, any]>;

    return normalizedEntries;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => [String(index), entry] as [string, any])
      .filter(([, entry]) => {
        if (!entry || typeof entry !== 'object') return true;
        return hasPopulatedContent(entry, hiddenRules, showStructureType);
      });
  }

  const entries = Object.entries(value)
    .filter(([childKey, childValue]) => {
      if (childKey === 'address') return false;
      if (childKey === '__lazySpCoinMetaData') return false;
      if (childKey === '__lazyMasterAccountKeys') return false;
      if (childKey === '__lazyAccountRelation') return false;
      if (childKey === '__lazyPendingRewardsAction') return false;
      if (childKey === '__pendingRewardsRefreshAction') return false;
      if (childKey === '__pendingRewardsRefreshAtMs') return false;
      if (childKey === '__pendingRewardsRefreshActionName') return false;
      if (childKey === '__pendingRewardsModeLabel') return false;
      if (childKey === '__pendingRewardsModeValue') return false;
      if (childKey === '__forceExpanded') return false;
      if (childKey === '__showEmptyFields') return false;
      if (childKey === 'parameters' && value && typeof value === 'object' && !Array.isArray(value) && typeof (value as Record<string, unknown>).call === 'object') return false;
      if (isLazyAccountRelationNode(value) && ['accountKey', 'relation', 'count', 'method'].includes(childKey)) return false;
      if (isLazyPendingRewardsActionNode(value) && ['accountKey', 'action', 'method'].includes(childKey)) return false;
      if (isPendingRewardsRecord(value) && (childKey === 'claim' || childKey === 'estimate')) return false;
      if (isPendingRewardsInternalField(value, childKey)) return false;
      if (hideEntryKeys.includes(childKey)) return false;
      if (isTotalSpCoinsPendingRewards(value, childKey, childValue)) return true;
      if (forceShowEntryKeys.includes(childKey)) return true;
      if (!showStructureType && childKey === 'TYPE') return false;
      if (!childValue || typeof childValue !== 'object') return hasPopulatedContent(childValue, hiddenRules, showStructureType);
      return hasPopulatedContent(childValue, hiddenRules, showStructureType);
    })
    .sort(sortEntries);
  const normalizedEntries = normalizePendingRewardsModeEntries(entries);
  return normalizedEntries;
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
  lockPendingRewardsMode = false,
  scriptStepDragState,
}) => {
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
  );
  const addressNode =
    data && typeof data === 'object' && !Array.isArray(data)
      ? String((data as Record<string, unknown>).address || (data as Record<string, unknown>).accountKey || '').trim()
      : '';
  const isAddressNode = /^0x[0-9a-fA-F]{40}$/.test(addressNode);
  const hasLoadedAccountRecord = isAddressNode && hasInlineAccountRecord(data);
  const isLazyPendingRewardsAction = isLazyPendingRewardsActionNode(data);
  const isLazyAddressStub = isAddressNode && !hasLoadedAccountRecord && visibleEntries.length === 0 && !isLazyPendingRewardsAction;
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
      isLazyPendingRewardsAction ||
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
    if (isCollapsed && isLazyPendingRewardsAction) {
      const isDirectActionButton =
        String(label || '').trim() === 'claimPendingRewards' ||
        String(label || '').trim() === 'updatePendingRewards';
      if (isDirectActionButton) {
        updateCollapsedKeys([...new Set(nextOpenKeys)]);
        return;
      }
      const isModeParameter =
        currentPath.includes('.parameters.') ||
        String(label || '').trim() === 'mode' ||
        String(label || '').trim() === 'claim' ||
        String(label || '').trim() === 'estimate';
      if (isModeParameter) {
        onLeafValueClick?.(
          JSON.stringify({
            __togglePendingRewardsMode: true,
            accountKey: String((data as Record<string, unknown>).accountKey || ''),
            action: String((data as Record<string, unknown>).action || ''),
          }),
          currentPath,
          'mode',
        );
        return;
      }
      updateCollapsedKeys([...new Set(nextOpenKeys)]);
      onLeafValueClick?.(
        JSON.stringify({
          __loadPendingRewardsAction: true,
          accountKey: String((data as Record<string, unknown>).accountKey || ''),
          action: String((data as Record<string, unknown>).action || ''),
        }),
        currentPath,
        String((data as Record<string, unknown>).action || 'pendingRewards'),
      );
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
        `${currentPath}.pendingRewards.runPendingRewards`,
        'runPendingRewards',
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
    isLazyPendingRewardsAction,
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

  const getValueColor = (value: any): string => {
    if (value === false || value === undefined || value === null) return 'text-red-500';
    if (typeof value === 'boolean') return 'text-yellow-300';
    return 'text-green-400';
  };

  const getPathLabel = (nextPath: string): string => {
    if (label && label.startsWith('onChainCalls')) return label;
    if (label && label.startsWith('childOnChainCalls')) return label;
    if (label) return isLazyPendingRewardsAction ? label : getAddressNodeLabel(data, label);
    if (nextPath === 'root') return rootLabel;
    if (nextPath === 'tradeData.slippage') return 'slippage';
    return getAddressNodeLabel(data, formatPathSegmentLabel(nextPath));
  };

  const getDisplayLabel = (nextPath: string): string => {
    const baseLabel = getPathLabel(nextPath);
    if (isLazyAccountRelation) return getLazyAccountRelationName(data, baseLabel);
    if (isLazyPendingRewardsAction) return getPendingRewardsActionName(data, baseLabel);
    if (!label || !data || typeof data !== 'object' || Array.isArray(data)) return baseLabel;
    const inlineSummaryValue = (data as Record<string, unknown>)[label];
    if (inlineSummaryValue !== undefined && inlineSummaryValue !== null && typeof inlineSummaryValue !== 'object') {
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
  const promotedStepEntries =
    stepCallRecord && !Array.isArray(stepCallRecord)
      ? [
          ...(stepCallRecord.parameters !== undefined && !hideEntryKeys.includes('parameters') && inlineStepMethod !== 'runPendingRewards'
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
    const nextPath = `${path}.${key}`;
    const isTotalSpCoinsActionButton =
      (key === 'claim' || key === 'update') &&
      isLazyPendingRewardsActionNode(value) &&
      !String(path || '').endsWith('.parameters');
    if (isTotalSpCoinsActionButton) {
      const actionLabel = key === 'claim' ? 'Claim' : 'Update';
      const rowHighlighted = highlightPathPrefixes.some(
        (prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}.`),
      );
      return (
        <div key={nextPath} className="ml-4 whitespace-nowrap">
          <button
            type="button"
            className={`inline-flex items-center gap-1 bg-transparent p-0 font-semibold ${
              rowHighlighted ? highlightColorClass : 'text-white'
            }`}
            onClick={() => {
              onLeafValueClick?.(
                JSON.stringify({
                  __loadPendingRewardsAction: true,
                  accountKey: String((value as Record<string, unknown>).accountKey || ''),
                  action: String((value as Record<string, unknown>).action || ''),
                }),
                nextPath,
                key,
              );
            }}
            title={`Run ${actionLabel} pending rewards`}
          >
            <span className="text-green-400">[+]</span> {actionLabel}
          </button>
        </div>
      );
    }
    const pendingRewardsModeAction =
      String(path || '').endsWith('.parameters') && (key === 'mode' || key === 'claim' || key === 'estimate')
        ? getPendingRewardsModeAction(value)
        : null;
    if (pendingRewardsModeAction && !lockPendingRewardsMode) {
      const rowHighlighted = highlightPathPrefixes.some(
        (prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}.`),
      );
      const modeLabel = getPendingRewardsActionName(pendingRewardsModeAction, 'mode');
      const toggleMode = () => {
        onTrace?.(
          `[JSON_INSPECTOR_TRACE] pendingRewards mode parameter toggle path=${nextPath} action=${String(pendingRewardsModeAction.action || '')} accountKey=${String(pendingRewardsModeAction.accountKey || '')}`,
        );
        onLeafValueClick?.(
          JSON.stringify({
            __togglePendingRewardsMode: true,
            accountKey: String(pendingRewardsModeAction.accountKey || ''),
            action: String(pendingRewardsModeAction.action || ''),
          }),
          nextPath,
          'mode',
        );
      };
      return (
        <div key={nextPath} className="ml-4 whitespace-nowrap">
          <button type="button" className="inline-flex items-center bg-transparent p-0" onClick={toggleMode}>
            <span className={rowHighlighted ? highlightColorClass : 'text-green-400'}>[+]</span>
          </button>{' '}
          <button
            type="button"
            className={`inline-flex bg-transparent p-0 text-left font-semibold underline decoration-dotted underline-offset-2 transition-colors hover:text-white focus:outline-none ${
              rowHighlighted ? highlightColorClass : 'text-white'
            }`}
            onClick={toggleMode}
            title="Change pending rewards mode parameter"
          >
            {modeLabel}
          </button>
        </div>
      );
    }
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
      const forceRenderObject = isTotalSpCoinsPendingRewards(data, key, value) || isLazyPendingRewardsActionNode(value);
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
          lockPendingRewardsMode={lockPendingRewardsMode || shouldForceExpandNode(data)}
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
        <button type="button" className="inline-flex items-center bg-transparent p-0" onClick={toggle}>
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
        ) : isAddressNode && (typeof onAddressNodeClick === 'function' || isLazyAddressStub) ? (
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
            {getDisplayLabel(path ?? '')}
          </button>
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
        {inlineStepMethod ? (
          <span className={`ml-3 ${isHighlighted ? highlightColorClass : 'text-green-400'}`}>
            {formatDisplayScalar('method', inlineStepMethod, false, tokenDecimals)}
          </span>
        ) : null}
        <div className={`mt-[2px] h-[2px] rounded-full ${activeDropPlacement === 'after' ? 'bg-[#8FA8FF]' : 'bg-transparent'}`} />
      </div>
      {!isCollapsed && <div className="ml-4">{promotedStepEntries.map(([key, value]) => renderValue(value, key))}</div>}
    </div>
  );
};

export default JsonInspector;
