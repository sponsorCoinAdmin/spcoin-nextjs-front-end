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
  hideEntryKeys?: string[];
  formatTokenAmounts?: boolean;
  tokenDecimals?: number | null;
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
  return typeof record.accountKey === 'string' || typeof record.TYPE === 'string';
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
    return value.some((entry) => hasPopulatedContent(entry, hiddenRules));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([key]) => key !== 'TYPE');
    if (entries.length === 0) return !hiddenRules.emptyCollections;
    return entries.some(([key, childValue]) => {
      if (key === 'TYPE') return false;
      return hasPopulatedContent(childValue, hiddenRules);
    });
  }
  return true;
}

function hasVisibleDescendants(
  value: any,
  showAll: boolean,
  hiddenRules: NonNullable<JsonInspectorProps['hiddenRules']>,
): boolean {
  if (showAll) return true;
  if (!value || typeof value !== 'object') return true;
  return hasPopulatedContent(value, hiddenRules);
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
): Array<[string, any]> {
  if (!value || typeof value !== 'object') return [];
  if (showAll) {
    if (Array.isArray(value)) {
      return value.map((entry, index) => [String(index), entry] as [string, any]);
    }
    return Object.entries(value)
      .filter(([childKey]) => childKey !== 'address' && !hideEntryKeys.includes(childKey))
      .sort(([leftKey], [rightKey]) => {
        const leftIsNumericIndex = /^\d+$/.test(String(leftKey));
        const rightIsNumericIndex = /^\d+$/.test(String(rightKey));
        if (leftIsNumericIndex === rightIsNumericIndex) return 0;
        return leftIsNumericIndex ? 1 : -1;
      });
  }

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => [String(index), entry] as [string, any])
      .filter(([, entry]) => {
        if (!entry || typeof entry !== 'object') return true;
        return hasPopulatedContent(entry, hiddenRules);
      });
  }

  return Object.entries(value)
    .filter(([childKey, childValue]) => {
      if (childKey === 'address') return false;
      if (hideEntryKeys.includes(childKey)) return false;
      if (!childValue || typeof childValue !== 'object') return hasPopulatedContent(childValue, hiddenRules);
      return hasPopulatedContent(childValue, hiddenRules);
    })
    .sort(([leftKey], [rightKey]) => {
      const leftIsNumericIndex = /^\d+$/.test(String(leftKey));
      const rightIsNumericIndex = /^\d+$/.test(String(rightKey));
      if (leftIsNumericIndex === rightIsNumericIndex) return 0;
      return leftIsNumericIndex ? 1 : -1;
    });
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
  hideEntryKeys = [],
  formatTokenAmounts = false,
  tokenDecimals = null,
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
  const visibleEntries = getVisibleEntries(data, showAll, hiddenRules, effectiveHideEntryKeys);
  const addressNode =
    data && typeof data === 'object' && !Array.isArray(data)
      ? String((data as Record<string, unknown>).address || (data as Record<string, unknown>).accountKey || '').trim()
      : '';
  const isAddressNode = /^0x[0-9a-fA-F]{40}$/.test(addressNode);
  const hasLoadedAccountRecord = isAddressNode && hasInlineAccountRecord(data);
  const isLazyAddressStub = isAddressNode && !hasLoadedAccountRecord && visibleEntries.length === 0;
  const isCollapsed = collapsedKeys.includes(path ?? '') || isLazyAddressStub;
  const isHighlighted = highlightPathPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}.`),
  );

  const toggle = useCallback(() => {
    if (isCollapsed && isAddressNode && !hasLoadedAccountRecord) {
      onLeafValueClick?.(addressNode, path ?? '', 'address');
    }
    updateCollapsedKeys(
      isCollapsed
        ? collapsedKeys.filter((key) => key !== path)
        : [...new Set([...collapsedKeys, path!])],
    );
  }, [addressNode, collapsedKeys, hasLoadedAccountRecord, isAddressNode, isCollapsed, onLeafValueClick, path, updateCollapsedKeys]);

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
      if (!hasVisibleDescendants(value, showAll, hiddenRules)) return null;
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
          hideEntryKeys={[key]}
          highlightPathPrefixes={highlightPathPrefixes}
          highlightColorClass={highlightColorClass}
          showAll={showAll}
          hiddenRules={hiddenRules}
          onLeafValueClick={onLeafValueClick}
          onAddressNodeClick={onAddressNodeClick}
          formatTokenAmounts={formatTokenAmounts}
          tokenDecimals={tokenDecimals}
        />
      );
    }

    const valueHighlighted = highlightPathPrefixes.some(
      (prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}.`),
    );
    const displayValue = formatDisplayScalar(key, value, formatTokenAmounts, tokenDecimals);
    const rawStringValue = typeof value === 'string' ? value.trim() : '';
    const isClickableAddress =
      typeof onLeafValueClick === 'function' &&
      /^0x[0-9a-fA-F]{40}$/.test(rawStringValue);
    return (
      <div key={nextPath} className="ml-4 whitespace-nowrap">
        <span className={valueHighlighted ? highlightColorClass : 'text-[#5981F3]'}>{key}</span>:{' '}
        {isClickableAddress ? (
          <span
            role="button"
            tabIndex={0}
            className={`cursor-pointer font-mono underline decoration-dotted underline-offset-2 transition-colors hover:text-white focus:outline-none ${valueHighlighted ? highlightColorClass : getValueColor(value)}`}
            onClick={(event) => {
              event.stopPropagation();
              onLeafValueClick?.(rawStringValue, nextPath, key);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              event.stopPropagation();
              onLeafValueClick?.(rawStringValue, nextPath, key);
            }}
            title={`Open account ${rawStringValue}`}
          >
            {displayValue}
          </span>
        ) : (
          <span className={valueHighlighted ? highlightColorClass : getValueColor(value)}>{displayValue}</span>
        )}
      </div>
    );
  };

  return (
    <div className={`${level > 0 ? 'ml-2' : ''} font-mono leading-tight`}>
      <div className="whitespace-nowrap">
        <button type="button" className="inline-flex items-center bg-transparent p-0" onClick={toggle}>
          <span className={isHighlighted ? highlightColorClass : isCollapsed ? 'text-green-400' : 'text-red-400'}>{isCollapsed ? '[+]' : '[-]'}</span>
        </button>{' '}
        {isAddressNode && typeof onAddressNodeClick === 'function' ? (
          <button
            type="button"
            className={`inline-flex bg-transparent p-0 text-left font-semibold underline decoration-dotted underline-offset-2 transition-colors hover:text-white focus:outline-none ${
              isHighlighted ? highlightColorClass : 'text-white'
            }`}
            onClick={(event) => {
              event.stopPropagation();
              onAddressNodeClick(addressNode, path ?? '', label || 'address');
            }}
            title={`Show metadata for ${addressNode}`}
          >
            {getDisplayLabel(path ?? '')}
          </button>
        ) : (
          <span className={`font-semibold ${isHighlighted ? highlightColorClass : 'text-white'}`}>{getDisplayLabel(path ?? '')}</span>
        )}
      </div>
      {!isCollapsed && <div className="ml-4">{visibleEntries.map(([key, value]) => renderValue(value, key))}</div>}
    </div>
  );
};

export default JsonInspector;
