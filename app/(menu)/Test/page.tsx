// File: @/app/(menu)/Test/page.tsx
'use client';

import { useCallback, useState } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';

import ExchangeContextTab from './Tabs/ExchangeContext';
import FSMTraceTab from './Tabs/FSMTrace';
import TestWalletsTab from './Tabs/TestWallets';
import ToDoTab from './Tabs/ToDo';

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

export default function TestPage() {
  const { state, setState } = usePageState();

  // Use a loose shape so we can evolve flags without fighting types here
  const pageAny: any = state.page?.exchangePage ?? {};
  const {
    showContext = false,
    showWallets = false,
    showPanels = false,
    showToDo = false,
    showFSMTracePanel = false,
  } = pageAny;

  const [quickSwitch, setQuickSwitch] = useState<string>('');

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

  // Dropdown is visible only when no tab is open
  const showRunTest = !(showContext || showWallets || showPanels || showToDo || showFSMTracePanel);

  // Open exactly one tab at a time
  const resetFlags = {
    showContext: false,
    showWallets: false,
    showPanels: false,
    showToDo: false,
    showFSMTracePanel: false,
  } as const;

  const handleQuickSwitch = useCallback((value: string) => {
    if (!value) return;

    switch (value) {
      case 'context':
        updateExchangePage({
          ...resetFlags,
          showContext: true,
          // Context tab can manage its own internal options (expand, active display) if needed.
        });
        break;
      case 'fsm':
        updateExchangePage({
          ...resetFlags,
          showFSMTracePanel: true,
        });
        break;
      case 'wallets':
        updateExchangePage({
          ...resetFlags,
          showWallets: true,
        });
        break;
      case 'panels':
        updateExchangePage({
          ...resetFlags,
          showPanels: true,
        });
        break;
      case 'todo':
        updateExchangePage({
          ...resetFlags,
          showToDo: true,
        });
        break;
      default:
        break;
    }

    // Reset so the same option can be selected again later
    setQuickSwitch('');
  }, [updateExchangePage]);

  return (
    <div className="space-y-6 p-6">
      {showRunTest && (
        <div className="w-full flex justify-center mb-4">
          <label htmlFor="quickSwitchSelect" className="sr-only">Run Test</label>
          <select
            id="quickSwitchSelect"
            className={buttonClasses}
            value={quickSwitch}
            onChange={(e) => handleQuickSwitch(e.target.value)}
            aria-label="Open Sponsor Coin Test Data"
            title="Open Sponsor Coin Test Data"
          >
            <option value="">Open Sponsor Coin Test Data</option>
            <option value="context">Exchange Context</option>
            <option value="fsm">FSM Trace</option>
            <option value="wallets">Test Wallets</option>
            <option value="panels">Panels</option>
            <option value="todo">ToDo's</option>
          </select>
        </div>
      )}

      {/* Tabs: each owns its own Close/Hide button and updates PageState.
          When a tab closes itself, all flags become false → the dropdown reappears. */}
      {showContext && <ExchangeContextTab />}
      {showWallets && <TestWalletsTab />}
      {showFSMTracePanel && <FSMTraceTab />}
      {showToDo && <ToDoTab />}
    </div>
  );
}
