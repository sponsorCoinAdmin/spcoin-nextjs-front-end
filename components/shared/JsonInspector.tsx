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
  onLeafValueClick?: (value: string, path: string, key: string) => void;
}

function getAddressNodeLabel(data: any, fallbackLabel: string): string {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return fallbackLabel;
  const address = typeof data.address === 'string' ? data.address.trim() : '';
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return fallbackLabel;
  return `${fallbackLabel}: "${address}"`;
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

function hasPopulatedContent(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
  if (typeof value === 'bigint') return value !== 0n;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return !['0', 'false', 'undefined', 'null', 'todo'].includes(trimmed.toLowerCase());
  }
  if (Array.isArray(value)) return value.some((entry) => hasPopulatedContent(entry));
  if (typeof value === 'object') {
    return Object.entries(value).some(([key, childValue]) => {
      if (key === 'TYPE') return false;
      return hasPopulatedContent(childValue);
    });
  }
  return true;
}

function hasVisibleDescendants(value: any, showAll: boolean): boolean {
  if (showAll) return true;
  if (!value || typeof value !== 'object') return true;
  return hasPopulatedContent(value);
}

function getVisibleEntries(value: any, showAll: boolean): Array<[string, any]> {
  if (!value || typeof value !== 'object') return [];
  if (showAll) {
    if (Array.isArray(value)) {
      return value.map((entry, index) => [String(index), entry] as [string, any]);
    }
    return Object.entries(value).filter(([childKey]) => childKey !== 'address');
  }

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => [String(index), entry] as [string, any])
      .filter(([, entry]) => {
        if (!entry || typeof entry !== 'object') return true;
        return hasPopulatedContent(entry);
      });
  }

  return Object.entries(value).filter(([childKey, childValue]) => {
    if (childKey === 'address') return false;
    if (!childValue || typeof childValue !== 'object') return true;
    return hasPopulatedContent(childValue);
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
  onLeafValueClick,
}) => {
  const visibleEntries = getVisibleEntries(data, showAll);
  const addressNode = data && typeof data === 'object' && !Array.isArray(data) ? String(data.address || '').trim() : '';
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
  }, [collapsedKeys, data, isCollapsed, onLeafValueClick, path, updateCollapsedKeys]);

  const getValueColor = (value: any): string => {
    if (value === false || value === undefined || value === null) return 'text-red-500';
    if (typeof value === 'boolean') return 'text-yellow-300';
    return 'text-green-400';
  };

  const getPathLabel = (nextPath: string): string => {
    if (label) return getAddressNodeLabel(data, label);
    if (nextPath === 'root') return rootLabel;
    if (nextPath === 'tradeData.slippage') return 'slippage';
    const segments = nextPath.split('.');
    return getAddressNodeLabel(data, segments[segments.length - 1] || nextPath);
  };

  const renderValue = (value: any, key: string) => {
    const nextPath = `${path}.${key}`;
    if (key === 'creationTime' || key === 'creationDate') {
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
      if (!hasVisibleDescendants(value, showAll)) return null;
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
          highlightPathPrefixes={highlightPathPrefixes}
          highlightColorClass={highlightColorClass}
          showAll={showAll}
          onLeafValueClick={onLeafValueClick}
        />
      );
    }

    const valueHighlighted = highlightPathPrefixes.some(
      (prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}.`),
    );
    const renderedValue = stringifyBigInt(value);
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
            {renderedValue}
          </span>
        ) : (
          <span className={valueHighlighted ? highlightColorClass : getValueColor(value)}>{renderedValue}</span>
        )}
      </div>
    );
  };

  return (
    <div className={`${level > 0 ? 'ml-2' : ''} font-mono leading-tight`}>
      <div className="cursor-pointer whitespace-nowrap" onClick={toggle}>
        <span className={isHighlighted ? highlightColorClass : isCollapsed ? 'text-green-400' : 'text-red-400'}>{isCollapsed ? '[+]' : '[-]'}</span>{' '}
        <span className={`font-semibold ${isHighlighted ? highlightColorClass : 'text-white'}`}>{getPathLabel(path ?? '')}</span>
      </div>
      {!isCollapsed && <div className="ml-4">{visibleEntries.map(([key, value]) => renderValue(value, key))}</div>}
    </div>
  );
};

export default JsonInspector;
