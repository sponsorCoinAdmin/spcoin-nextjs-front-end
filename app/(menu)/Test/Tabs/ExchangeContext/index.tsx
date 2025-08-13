// File: app/(menu)/Test/Tabs/ExchangeContext/index.tsx
'use client';

import React, { useCallback } from 'react';
import JsonInspector from '@/components/shared/JsonInspector';
import { usePageState } from '@/lib/context/PageStateContext';
import { useExchangeContext } from '@/lib/context/hooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { SP_COIN_DISPLAY } from '@/lib/structure';

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

function getAllNestedKeys(obj: any): string[] {
  const keys: string[] = [];
  if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([k, v]) => {
      keys.push(k);
      if (typeof v === 'object' && v !== null) {
        keys.push(...getAllNestedKeys(v));
      }
    });
  }
  return keys;
}

export default function ExchangeContextTab() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { state, setState } = usePageState();

  // Pull page UI state (loose typing to avoid churn with global types)
  const pageAny: any = state.page?.exchangePage ?? {};
  const collapsedKeys: string[] = pageAny.collapsedKeys ?? [];
  const expandContext: boolean = pageAny.expandContext ?? false;

  const updateExchangePage = useCallback((updates: any) => {
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
  }, [setState]);

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

  return (
    <div className="space-y-4">
      {/* Controls for this tab */}
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
            value={exchangeContext?.settings?.activeDisplay ?? SP_COIN_DISPLAY.TRADING_STATION_PANEL}
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
            <option value={SP_COIN_DISPLAY.TRADING_STATION_PANEL}>TRADING_STATION_PANEL</option>
            <option value={SP_COIN_DISPLAY.MANAGE_SPONSORS_BUTTON}>MANAGE_SPONSORS_BUTTON</option>
            <option value={SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL}>RECIPIENT_SELECT_PANEL</option>
            <option value={SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL}>ERROR_MESSAGE_PANEL</option>
            <option value={SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL}>SPONSOR_RATE_CONFIG_PANEL</option>
            <option value={SP_COIN_DISPLAY.AGENT_SELECT_PANEL}>AGENT_SELECT_PANEL</option>
            <option value={SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL}>SELL_SELECT_SCROLL_PANEL</option>
            <option value={SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL}>BUY_SELECT_SCROLL_PANEL</option>
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
