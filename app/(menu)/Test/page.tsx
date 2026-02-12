// File: @/app/(menu)/Test/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePageState } from '@/lib/context/PageStateContext';
import { useExchangePageState } from './Tabs/ExchangeContext/hooks/useExchangePageState';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useExchangeContext } from '@/lib/context/hooks';

import ExchangeContextTab from './Tabs/ExchangeContext';
import FSMTraceTab from './Tabs/FSMTrace';
import TestWalletsTab from './Tabs/TestWallets';
import ToDoTab from './Tabs/ToDo';
import PriceView from '@/app/(menu)/Exchange/Price';
import {
  clearFSMHeaderFromMemory,
  clearFSMTraceFromMemory,
} from '@/components/debug/FSMTracePanel';

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded border-0 outline-none ring-0 transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0';

export default function TestPage() {
  const router = useRouter();
  const { state, setState } = usePageState();
  const { exchangeContext } = useExchangeContext();
  const { expandContext, setExpandContext, hideContext, logContext } = useExchangePageState();
  const { dumpNavStack } = usePanelTree();
  const toggleAllRef = useRef<((nextExpand: boolean) => void) | null>(null);
  const [headerHeight, setHeaderHeight] = useState(72);
  const [fsmPanelKey, setFsmPanelKey] = useState(0);

  // Use a loose shape so we can evolve flags without fighting types here
  const pageAny: any = state.page?.exchangePage ?? {};
  const {
    showContext = false,
    showWallets = false,
    showToDo = false,
    showFSMTracePanel = false,
    selectedTestTab,
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
            selectedTestTab: 'context',
          });
          break;
        case 'fsm':
          updateExchangePage({
            ...resetFlags,
            showFSMTracePanel: true,
            selectedTestTab: 'fsm',
          });
          break;
        case 'wallets':
          updateExchangePage({
            ...resetFlags,
            showWallets: true,
            selectedTestTab: 'wallets',
          });
          break;
        case 'todo':
          updateExchangePage({
            ...resetFlags,
            showToDo: true,
            selectedTestTab: 'todo',
          });
          break;
        default:
          break;
      }

    },
    [updateExchangePage],
  );

  const selectedTab =
    selectedTestTab === 'context' ||
    selectedTestTab === 'fsm' ||
    selectedTestTab === 'wallets' ||
    selectedTestTab === 'todo'
      ? selectedTestTab
      : showContext
        ? 'context'
        : showFSMTracePanel
          ? 'fsm'
          : showWallets
            ? 'wallets'
            : showToDo
              ? 'todo'
              : 'context';
  const activeAccount = exchangeContext?.accounts?.activeAccount;
  const activeAccountText =
    activeAccount?.name?.trim() ||
    activeAccount?.symbol?.trim() ||
    activeAccount?.address?.trim() ||
    'N/A';

  useEffect(() => {
    const hasOpenTab = showContext || showWallets || showToDo || showFSMTracePanel;
    if (hasOpenTab) return;

    switch (selectedTab) {
      case 'fsm':
      case 'wallets':
      case 'todo':
      case 'context':
        handleQuickSwitch(selectedTab);
        break;
      default:
        handleQuickSwitch('context');
        break;
    }
  }, [selectedTab, showContext, showWallets, showToDo, showFSMTracePanel, handleQuickSwitch]);

  const onToggleExpand = useCallback(() => {
    const next = !expandContext;
    setExpandContext(next);
    toggleAllRef.current?.(next);
  }, [expandContext, setExpandContext]);

  const onCloseContext = useCallback(() => {
    hideContext();
    router.push('/Exchange');
  }, [hideContext, router]);

  const clearFSMHeader = useCallback(() => {
    clearFSMHeaderFromMemory();
    setFsmPanelKey((k) => k + 1);
  }, []);

  const clearFSMTrace = useCallback(() => {
    clearFSMTraceFromMemory();
    setFsmPanelKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('header');
      const next = header instanceof HTMLElement ? header.offsetHeight : 72;
      setHeaderHeight(next > 0 ? next : 72);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div
      className="overflow-hidden p-6"
      style={{
        height: `calc(100dvh - ${headerHeight}px)`,
        overflowX: 'hidden',
        overflowY: 'hidden',
      }}
    >
      <div className="flex h-full gap-4 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col">
            <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-4 bg-[#192134] pb-2">
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
                <option value="wallets">Sponsor Accounts</option>
                <option value="todo">ToDo&apos;s</option>
              </select>

              {showContext && (
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
              )}

              {selectedTab === 'fsm' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={clearFSMHeader} className={buttonClasses}>
                    Clear FSM Header
                  </button>
                  <button onClick={clearFSMTrace} className={buttonClasses}>
                    Clear FSM Trace
                  </button>
                </div>
              )}

              {selectedTab === 'wallets' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className={buttonClasses}>Active Account::</span>
                  <input
                    readOnly
                    value={activeAccountText}
                    className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded border-0 outline-none ring-0 min-w-[260px]"
                    aria-label="Active Account"
                    title={activeAccountText}
                  />
                </div>
              )}

              <button
                onClick={onCloseContext}
                aria-label="Close Context"
                title="Close Context"
                className="ml-auto h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
                type="button"
              >
                &times;
              </button>
            </div>

            <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              {/* Tabs: each owns its own Close/Hide button and updates PageState. */}
              {showContext && (
                <ExchangeContextTab
                  onToggleAllReady={(toggleAllFn) => {
                    toggleAllRef.current = toggleAllFn;
                  }}
                />
              )}
              {showWallets && <TestWalletsTab />}
              {showFSMTracePanel && <FSMTraceTab panelKey={fsmPanelKey} />}
              {showToDo && <ToDoTab />}
            </div>
          </div>
        </div>

        <div className="scrollbar-hide min-w-0 flex-1 overflow-y-auto overflow-x-hidden border-l border-slate-700 pl-4">
          <div className="flex h-full min-h-0 flex-col items-center justify-between p-24">
            <PriceView />
          </div>
        </div>
      </div>
    </div>
  );
}

