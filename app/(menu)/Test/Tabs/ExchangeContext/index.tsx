// File: app/(menu)/Test/Tabs/ExchangeContext/index.tsx

'use client';

import React, { useCallback, useMemo } from 'react';
import JsonInspector from '@/components/shared/JsonInspector';
import { usePageState } from '@/lib/context/PageStateContext';
import { useExchangeContext } from '@/lib/context/hooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { SP_COIN_DISPLAY } from '@/lib/structure';

// Utility to build dropdown options from enum values
function getNumericEnumEntries<E extends Record<string, string | number>>(
  e: E,
  prefix: string
): Array<{ value: number; label: string }> {
  return Object.keys(e)
    .filter((k) => typeof (e as any)[k] === 'number')
    .map((k) => ({ value: (e as any)[k] as number, label: `${prefix}.${k}` }))
    .sort((a, b) => a.value - b.value);
}

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

function getAllNestedKeys(obj: any): string[] {
  const keys: string[] = [];
  if (typeof obj === 'object' && obj !== null) {
    for (const [k, v] of Object.entries(obj)) {
      keys.push(k);
      if (typeof v === 'object' && v !== null) keys.push(...getAllNestedKeys(v));
    }
  }
  return keys;
}

export default function ExchangeContextTab() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { state, setState } = usePageState();

  const pageAny: any = state.page?.exchangePage ?? {};
  const collapsedKeys: string[] = pageAny.collapsedKeys ?? [];
  const expandContext: boolean = pageAny.expandContext ?? false;

  const updateExchangePage = useCallback(
    (updates: any) => {
      setState((prev: any) => ({
        ...prev,
        page: {
          ...prev?.page,
          exchangePage: {
            ...(prev?.page?.exchangePage ?? {}),
            ...updates,
          },
        },
      }));
    },
    [setState]
  );

  const hideContext = useCallback(() => {
    updateExchangePage({ showContext: false, showActiveDisplayPanel: false });
  }, [updateExchangePage]);

  const toggleExpandCollapse = useCallback(() => {
    const nextExpand = !expandContext;
    const nextKeys = nextExpand ? [] : getAllNestedKeys(exchangeContext);
    updateExchangePage({
      expandContext: nextExpand,
      collapsedKeys: nextKeys,
    });
  }, [expandContext, exchangeContext, updateExchangePage]);

  const logContext = useCallback(() => {
    console.log('📦 Log Context (tab):', stringifyBigInt(exchangeContext));
  }, [exchangeContext]);

  const handleUpdateCollapsedKeys = useCallback(
    (next: string[]) => updateExchangePage({ collapsedKeys: next }),
    [updateExchangePage]
  );

  const displayOptions = useMemo(
    () => getNumericEnumEntries(SP_COIN_DISPLAY, 'SP_COIN_DISPLAY'),
    []
  );

  const activeValue =
    exchangeContext?.settings?.activeDisplay ?? SP_COIN_DISPLAY.TRADING_STATION_PANEL;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="w-full flex flex-wrap justify-center gap-4">
        <button onClick={hideContext} className={buttonClasses}>
          Hide Context
        </button>
        <button onClick={toggleExpandCollapse} className={buttonClasses}>
          {expandContext ? 'Collapse Context' : 'Expand Context'}
        </button>
        <button onClick={logContext} className={buttonClasses}>
          Log Context
        </button>

        <select
          id="activeDisplaySelect_tab"
          title="Select activeDisplay"
          aria-label="Select activeDisplay"
          value={activeValue}
          onChange={(e) => {
            const selected = Number(e.target.value);
            setExchangeContext((prev: any) => ({
              ...prev,
              settings: {
                ...prev?.settings,
                activeDisplay: selected,
              },
            }));
          }}
          className={buttonClasses}
        >
          {displayOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Context viewer */}
      <JsonInspector
        data={exchangeContext}
        collapsedKeys={collapsedKeys}
        updateCollapsedKeys={handleUpdateCollapsedKeys}
      />
    </div>
  );
}
