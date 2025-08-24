// FILE: app/(menu)/Test/Tabs/ExchangeContext/index.tsx

'use client';

import React, { useCallback, useMemo } from 'react';
import JsonInspector from '@/components/shared/JsonInspector';
import { usePageState } from '@/lib/context/PageStateContext';
import { useExchangeContext, useActiveDisplay } from '@/lib/context/hooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { SP_COIN_DISPLAY, FEED_TYPE } from '@/lib/structure';

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

/**
 * Registry of enum fields to pretty-print in the inspector.
 * Add more as needed (e.g., panelState: PANEL_STATE).
 */
const enumRegistry: Record<string, any> = {
  activeDisplay: SP_COIN_DISPLAY,
  feedType: FEED_TYPE,
};

/**
 * Display-only clone of the object where any registered enum field is shown as:
 *   key(number): LABEL
 * Example:
 *   activeDisplay(0): AGENT_SELECT_PANEL
 *
 * If no label is found, we show: key(number): [number]
 */
function refineEnumLabels(input: any): any {
  if (Array.isArray(input)) return input.map(refineEnumLabels);
  if (input && typeof input === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(input)) {
      const enumObj = enumRegistry[k];
      if (enumObj && typeof v === 'number') {
        const label = enumObj[v];
        const prettyValue = typeof label === 'string' ? label : `[${v}]`;
        out[`${k}(${v})`] = prettyValue; // replace key entirely
      } else {
        out[k] = refineEnumLabels(v);
      }
    }
    return out;
  }
  return input;
}

export default function ExchangeContextTab() {
  const { exchangeContext } = useExchangeContext();
  const { activeDisplay, setActiveDisplay } = useActiveDisplay();
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

  // Inspector view: enums rendered as key(number): LABEL
  const contextForInspector = useMemo(
    () => refineEnumLabels(exchangeContext),
    [exchangeContext]
  );

  return (
    <div className="space-y-4">
      {/* Top bar: all controls centered; X at top-right; shift whole bar up by 15px */}
      <div className="relative w-full -mt-[15px]">
        {/* Centered controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-2">
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
            value={activeDisplay}
            onChange={(e) => {
              const selected = Number(e.target.value) as number;
              setActiveDisplay(selected as any);
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

        {/* Top-right Close "X" (double text size) */}
        <button
          onClick={hideContext}
          aria-label="Close Context"
          title="Close Context"
          className="absolute top-1 right-1 h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none
                     hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
        >
          ×
        </button>
      </div>

      {/* Context viewer */}
      <JsonInspector
        data={contextForInspector}
        collapsedKeys={collapsedKeys}
        updateCollapsedKeys={handleUpdateCollapsedKeys}
      />
    </div>
  );
}
