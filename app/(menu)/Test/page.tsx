// File: app/(menu)/Test/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';

import { useExchangeContext } from '@/lib/context/hooks';
import { usePageState } from '@/lib/context/PageStateContext';

import ExchangeContextTab from './Tabs/ExchangeContext';
import FSMTraceTab from './Tabs/FSMTrace';
import TestWalletsTab from './Tabs/TestWallets';
import PanelsTab from './Tabs/Panels';
import ToDoTab from './Tabs/ToDo';

function useDidHydrate(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

export default function TestPage() {
  const isHydrated = useDidHydrate();
  const { exchangeContext } = useExchangeContext();
  const { state, setState } = usePageState();

  // Loosen local typing so we can use new fields before the global type is updated
  const pageAny: any = state.page?.exchangePage ?? {};
  const {
    showContext = false,
    showWallets = false,
    collapsedKeys = [],
    showPanels = false,
    showToDo = false,
    showFSMTracePanel = false, // ← read from PageState
  } = pageAny;

  const [quickSwitch, setQuickSwitch] = useState<string>(''); // select value

  useEffect(() => {
    try {
      localStorage.setItem('PageStateContext', JSON.stringify(state));
    } catch {}
  }, [state]);

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

  // Central quick-switch handler (used to SHOW a section)
  const handleQuickSwitch = useCallback((value: string) => {
    if (!value) return;

    switch (value) {
      case 'context':
        updateExchangePage({
          showContext: true,
          showActiveDisplayPanel: true,
          expandContext: false,
          showWallets: false,
          showPanels: false,
          showToDo: false,
          showFSMTracePanel: false,
        });
        break;
      case 'fsm':
        updateExchangePage({
          showFSMTracePanel: true,
          showContext: false,
          showActiveDisplayPanel: false,
          expandContext: false,
          showWallets: false,
          showPanels: false,
          showToDo: false,
        });
        break;
      case 'wallets':
        updateExchangePage({
          showWallets: true,
          showContext: false,
          showActiveDisplayPanel: false,
          expandContext: false,
          showPanels: false,
          showToDo: false,
          showFSMTracePanel: false,
        });
        break;
      case 'panels':
        updateExchangePage({
          showPanels: true,
          showContext: false,
          showActiveDisplayPanel: false,
          expandContext: false,
          showWallets: false,
          showToDo: false,
          showFSMTracePanel: false,
        });
        break;
      case 'todo':
        updateExchangePage({
          showToDo: true,
          showContext: false,
          showActiveDisplayPanel: false,
          expandContext: false,
          showWallets: false,
          showPanels: false,
          showFSMTracePanel: false,
        });
        break;
      default:
        break;
    }

    // reset selection so the same choice can be picked again later
    setQuickSwitch('');
  }, [updateExchangePage]);

  return (
    <div className="space-y-6 p-6">
      {isHydrated && (
        <>
          {/* Centered "Run Test" dropdown */}
          <div className="w-full flex justify-center mb-4">
            <label htmlFor="quickSwitchSelect" className="sr-only">Run Test</label>
            <select
              id="quickSwitchSelect"
              className={buttonClasses}
              value={quickSwitch}
              onChange={(e) => handleQuickSwitch(e.target.value)}
              aria-label="Run Test"
              title="Run Test"
            >
              <option value="">Run Test</option>
              <option value="context">Show Context</option>
              <option value="fsm">Show FSM Trace</option>
              <option value="wallets">Show Test Wallets</option>
              <option value="panels">Show Panels</option>
              <option value="todo">Show ToDo</option>
            </select>
          </div>
        </>
      )}

      {/* Body tabs */}
      {isHydrated && showContext && (
        <ExchangeContextTab
          exchangeContext={exchangeContext}
          collapsedKeys={collapsedKeys}
          updateCollapsedKeys={(next) => updateExchangePage({ collapsedKeys: next })}
        />
      )}

      {isHydrated && showWallets && <TestWalletsTab />}
      {isHydrated && showFSMTracePanel && <FSMTraceTab />}
      {isHydrated && showPanels && <PanelsTab />}
      {isHydrated && showToDo && <ToDoTab />}
    </div>
  );
}
