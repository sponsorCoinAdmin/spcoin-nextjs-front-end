'use client';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import React, { useCallback } from 'react';

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
  formatTokenAmounts?: boolean;
  tokenDecimals?: number | null;
  showStructureType?: boolean;
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
    record.__forceExpanded === true ||
      typeof record.accountKey === 'string' ||
      typeof record.TYPE === 'string' ||
      record.totalSpCoins ||
      record.recipientKeys ||
      record.agentKeys ||
      record.parentRecipientKeys ||
      record.meta ||
      record.value !== undefined,
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
      (data as Record<string, unknown>).__showEmptyFields === true,
  );
}

function getExpandedPathKey(path: string) {
  return `__expanded__:${path}`;
}

function normalizeLegacyDateDisplay(value: any): string | null {
  const normalizeDisplayDateString = (input: string): string | null => {
    const trimmed = String(input || '').trim();
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
  showStructureType = false,
): Array<[string, any]> {
  const sortEntries = ([leftKey]: [string, any], [rightKey]: [string, any]) => {
    if (leftKey === 'meta' && rightKey !== 'meta') return -1;
    if (rightKey === 'meta' && leftKey !== 'meta') return 1;
    if (leftKey === 'onChainCalls' && rightKey !== 'onChainCalls') return 1;
    if (rightKey === 'onChainCalls' && leftKey !== 'onChainCalls') return -1;
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
    return Object.entries(value)
      .filter(
        ([childKey]) =>
          childKey !== 'address' &&
          childKey !== '__lazySpCoinMetaData' &&
          childKey !== '__lazyMasterAccountKeys' &&
          childKey !== '__forceExpanded' &&
          childKey !== '__showEmptyFields' &&
          !hideEntryKeys.includes(childKey) &&
          (showStructureType || childKey !== 'TYPE'),
      )
      .sort(sortEntries);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => [String(index), entry] as [string, any])
      .filter(([, entry]) => {
        if (!entry || typeof entry !== 'object') return true;
        return hasPopulatedContent(entry, hiddenRules, showStructureType);
      });
  }

  return Object.entries(value)
    .filter(([childKey, childValue]) => {
      if (childKey === 'address') return false;
      if (childKey === '__lazySpCoinMetaData') return false;
      if (childKey === '__lazyMasterAccountKeys') return false;
      if (childKey === '__forceExpanded') return false;
      if (childKey === '__showEmptyFields') return false;
      if (hideEntryKeys.includes(childKey)) return false;
      if (!showStructureType && childKey === 'TYPE') return false;
      if (!childValue || typeof childValue !== 'object') return hasPopulatedContent(childValue, hiddenRules, showStructureType);
      return hasPopulatedContent(childValue, hiddenRules, showStructureType);
    })
    .sort(sortEntries);
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
  formatTokenAmounts = false,
  tokenDecimals = null,
  showStructureType = false,
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
  const visibleEntries = getVisibleEntries(data, showAll, hiddenRules, effectiveHideEntryKeys, showStructureType);
  const addressNode =
    data && typeof data === 'object' && !Array.isArray(data)
      ? String((data as Record<string, unknown>).address || (data as Record<string, unknown>).accountKey || '').trim()
      : '';
  const isAddressNode = /^0x[0-9a-fA-F]{40}$/.test(addressNode);
  const hasLoadedAccountRecord = isAddressNode && hasInlineAccountRecord(data);
  const isLazyAddressStub = isAddressNode && !hasLoadedAccountRecord && visibleEntries.length === 0;
  const isLazySpCoinMetaData = isLazySpCoinMetaDataNode(data);
  const isLazyMasterAccountKeys = isLazyMasterAccountKeysNode(data);
  const shouldForceExpand = shouldForceExpandNode(data);
  const currentPath = path ?? '';
  const expandedPathKey = getExpandedPathKey(currentPath);
  const forceExpandedDismissedKey = `__force_expanded_dismissed__:${currentPath}`;
  const forceExpandedIsActive = shouldForceExpand && !collapsedKeys.includes(forceExpandedDismissedKey);
  const isExplicitlyExpanded = forceExpandedIsActive || collapsedKeys.includes(expandedPathKey);
  const isDefaultCollapsed = level > 0 && !isExplicitlyExpanded;
  const isCollapsed =
    !forceExpandedIsActive &&
    (collapsedKeys.includes(currentPath) ||
      isDefaultCollapsed ||
      isLazyAddressStub ||
      isLazySpCoinMetaData ||
      isLazyMasterAccountKeys);
  const isHighlighted = highlightPathPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}.`),
  );
  const toggle = useCallback(() => {
    onTrace?.(
      `[JSON_INSPECTOR_TRACE] toggle path=${currentPath} collapsed=${String(isCollapsed)} addressNode=${String(isAddressNode)} lazyAddress=${String(isLazyAddressStub)} loaded=${String(hasLoadedAccountRecord)} lazyMeta=${String(isLazySpCoinMetaData)} lazyMasterKeys=${String(isLazyMasterAccountKeys)}`,
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
    isLazySpCoinMetaData,
    isLazyMasterAccountKeys,
    onLeafValueClick,
    onTrace,
    updateCollapsedKeys,
  ]);

  const getValueColor = (value: any): string => {
    if (value === false || value === undefined || value === null) return 'text-red-500';
    if (typeof value === 'boolean') return 'text-yellow-300';
    return 'text-green-400';
  };

  const getPathLabel = (nextPath: string): string => {
    if (label) return getAddressNodeLabel(data, formatPathSegmentLabel(nextPath));
    if (nextPath === 'root') return rootLabel;
    if (nextPath === 'tradeData.slippage') return 'slippage';
    return getAddressNodeLabel(data, formatPathSegmentLabel(nextPath));
  };

  const getDisplayLabel = (nextPath: string): string => {
    const baseLabel = getPathLabel(nextPath);
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
    const nextPath = `${path}.${key}`;
    if (key === 'creationTime' || key === 'creationDate') {
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
      if (!hasVisibleDescendants(value, showAll, hiddenRules, showStructureType)) return null;
      return (
        <JsonInspector
          key={nextPath}
          data={value}
          collapsedKeys={collapsedKeys}
          updateCollapsedKeys={updateCollapsedKeys}
          level={level + 1}
          path={nextPath}
          rootLabel={rootLabel}
          label={key}
          hideEntryKeys={hideEntryKeys}
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
            <span
              role={typeof onAddressNodeClick === 'function' ? 'button' : undefined}
              tabIndex={typeof onAddressNodeClick === 'function' ? 0 : undefined}
              className={`font-mono underline decoration-dotted underline-offset-2 transition-colors ${
                typeof onAddressNodeClick === 'function' ? 'cursor-pointer hover:text-white focus:outline-none' : ''
              } ${valueHighlighted ? highlightColorClass : getValueColor(value)}`}
              onClick={(event) => {
                if (typeof onAddressNodeClick !== 'function') return;
                event.stopPropagation();
                onTrace?.(`[JSON_INSPECTOR_TRACE] scalar address click path=${nextPath} key=${key} value=${rawStringValue}`);
                onAddressNodeClick(rawStringValue, nextPath, key);
              }}
              onKeyDown={(event) => {
                if (typeof onAddressNodeClick !== 'function') return;
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                event.stopPropagation();
                onTrace?.(`[JSON_INSPECTOR_TRACE] scalar address keydown path=${nextPath} key=${key} value=${rawStringValue} eventKey=${event.key}`);
                onAddressNodeClick(rawStringValue, nextPath, key);
              }}
              title={`Show metadata for ${rawStringValue}`}
            >
              {displayValue}
            </span>
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
        {isAddressNode && (typeof onAddressNodeClick === 'function' || isLazyAddressStub) ? (
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
