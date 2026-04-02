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
  if (showAll) return Object.entries(value);

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => [String(index), entry] as [string, any])
      .filter(([, entry]) => {
        if (!entry || typeof entry !== 'object') return true;
        return hasPopulatedContent(entry);
      });
  }

  return Object.entries(value).filter(([, childValue]) => {
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
}) => {
  const visibleEntries = getVisibleEntries(data, showAll);
  const isCollapsed = collapsedKeys.includes(path ?? '');
  const isHighlighted = highlightPathPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}.`),
  );

  const toggle = useCallback(() => {
    updateCollapsedKeys(
      isCollapsed
        ? collapsedKeys.filter((key) => key !== path)
        : [...new Set([...collapsedKeys, path!])],
    );
  }, [isCollapsed, collapsedKeys, updateCollapsedKeys, path]);

  const getValueColor = (value: any): string => {
    if (value === false || value === undefined || value === null) return 'text-red-500';
    if (typeof value === 'boolean') return 'text-yellow-300';
    return 'text-green-400';
  };

  const getPathLabel = (nextPath: string): string => {
    if (label) return label;
    if (nextPath === 'root') return rootLabel;
    if (nextPath === 'tradeData.slippage') return 'slippage';
    const segments = nextPath.split('.');
    return segments[segments.length - 1] || nextPath;
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
        />
      );
    }

    const valueHighlighted = highlightPathPrefixes.some(
      (prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}.`),
    );
    return (
      <div key={nextPath} className="ml-4 whitespace-nowrap">
        <span className={valueHighlighted ? highlightColorClass : 'text-[#5981F3]'}>{key}</span>: <span className={valueHighlighted ? highlightColorClass : getValueColor(value)}>{stringifyBigInt(value)}</span>
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
