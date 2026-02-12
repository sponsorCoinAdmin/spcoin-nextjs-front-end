// File: @/app/(menu)/Test/page.tsx
'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePageState } from '@/lib/context/PageStateContext';
import { useExchangePageState } from './Tabs/ExchangeContext/hooks/useExchangePageState';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

import ExchangeContextTab from './Tabs/ExchangeContext';
import FSMTraceTab from './Tabs/FSMTrace';
import TestWalletsTab from './Tabs/TestWallets';
import ToDoTab from './Tabs/ToDo';
import PriceView from '@/app/(menu)/Exchange/Price';

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

export default function TestPage() {
  const router = useRouter();
  const { state, setState } = usePageState();
  const { expandContext, setExpandContext, hideContext, logContext } = useExchangePageState();
  const { dumpNavStack } = usePanelTree();
  const toggleAllRef = useRef<((nextExpand: boolean) => void) | null>(null);

  // Use a loose shape so we can evolve flags without fighting types here
  const pageAny: any = state.page?.exchangePage ?? {};
  const {
    showContext = false,
    showWallets = false,
    showToDo = false,
    showFSMTracePanel = false,
  } = pageAny;

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
    [setState],
  );

  // Open exactly one tab at a time
  const resetFlags = {
    showContext: false,
    showWallets: false,
    showToDo: false,
    showFSMTracePanel: false,
  } as const;

  const handleQuickSwitch = useCallback(
    (value: string) => {
      if (!value) return;

      switch (value) {
        case 'context':
          updateExchangePage({
            ...resetFlags,
            showContext: true,
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
        case 'todo':
          updateExchangePage({
            ...resetFlags,
            showToDo: true,
          });
          break;
        default:
          break;
      }

    },
    [updateExchangePage],
  );

  const selectedTab = showContext
    ? 'context'
    : showFSMTracePanel
      ? 'fsm'
      : showWallets
        ? 'wallets'
        : showToDo
          ? 'todo'
          : 'context';

  const onToggleExpand = useCallback(() => {
    const next = !expandContext;
    setExpandContext(next);
    toggleAllRef.current?.(next);
  }, [expandContext, setExpandContext]);

  const onCloseContext = useCallback(() => {
    hideContext();
    router.push('/Exchange');
  }, [hideContext, router]);

  return (
    <div className="p-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <label htmlFor="quickSwitchSelect" className="sr-only">
              Run Test
            </label>
            <select
              id="quickSwitchSelect"
              className={buttonClasses}
              value={selectedTab}
              onChange={(e) => handleQuickSwitch(e.target.value)}
              aria-label="Open Sponsor Coin Test Data"
              title="Open Sponsor Coin Test Data"
            >
              <option value="context">Exchange Context</option>
              <option value="fsm">FSM Trace</option>
              <option value="wallets">Test Wallets</option>
              <option value="todo">ToDo&apos;s</option>
            </select>

            {showContext && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={onToggleExpand} className={buttonClasses}>
                    {expandContext ? 'Collapse Context' : 'Expand Context'}
                  </button>
                  <button onClick={logContext} className={buttonClasses}>
                    Log Context
                  </button>
                  <button onClick={() => dumpNavStack?.()} className={buttonClasses}>
                    Panel Stack Dump
                  </button>
                </div>
                <button
                  onClick={onCloseContext}
                  aria-label="Close Context"
                  title="Close Context"
                  className="ml-auto h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
                  type="button"
                >
                  ×
                </button>
              </>
            )}
          </div>

          {/* Tabs: each owns its own Close/Hide button and updates PageState. */}
          {showContext && (
            <ExchangeContextTab
              onToggleAllReady={(toggleAllFn) => {
                toggleAllRef.current = toggleAllFn;
              }}
            />
          )}
          {showWallets && <TestWalletsTab />}
          {showFSMTracePanel && <FSMTraceTab />}
          {showToDo && <ToDoTab />}
        </div>

        <div className="flex-1 border-l border-slate-700 pl-4">
          <div className="flex min-h-screen flex-col items-center justify-between p-24">
            <PriceView />
          </div>
        </div>
      </div>
    </div>
  );
}
