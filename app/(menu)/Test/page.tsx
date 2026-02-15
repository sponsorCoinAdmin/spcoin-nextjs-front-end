// File: app/(menu)/Test/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';
import { useExchangePageState } from './Tabs/ExchangeContext/hooks/useExchangePageState';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useExchangeContext } from '@/lib/context/hooks';

import ExchangeContextTab from './Tabs/ExchangeContext';
import FSMTraceTab from './Tabs/FSMTrace';
import TestWalletsTab from './Tabs/TestAccounts';
import ToDoTab from './Tabs/ToDo';
import PriceView from '@/app/(menu)/Exchange/Price';
import type { AccountFilter } from '@/app/(menu)/Test/Tabs/TestAccounts';
import {
  clearFSMHeaderFromMemory,
  clearFSMTraceFromMemory,
} from '@/components/debug/FSMTracePanel';
import { SP_COIN_DISPLAY } from '@/lib/structure';

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded border-0 outline-none ring-0 transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0';
const panelIconButtonBase =
  'h-10 w-10 rounded-full flex items-center justify-center leading-none text-3xl select-none transition-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:scale-100';
const panelIconButtonBlue =
  `${panelIconButtonBase} bg-[#243056] text-[#5981F3] hover:bg-[#5981F3] hover:text-[#243056]`;
const panelIconButtonGreen =
  `${panelIconButtonBase} bg-green-900 text-green-300 hover:bg-green-500 hover:text-green-950`;

type TestTab = 'context' | 'fsm' | 'wallets' | 'todo';
type TestPageDisplay =
  | SP_COIN_DISPLAY.TEST_PAGE_EXCHANGE_CONTEXT
  | SP_COIN_DISPLAY.TEST_PAGE_FSM_TRACE
  | SP_COIN_DISPLAY.TEST_PAGE_ACCOUNT_LISTS
  | SP_COIN_DISPLAY.TEST_PAGE_TO_DOS;
const panelLayoutOptions = ['Both Open', 'Left Only', 'Right Only'] as const;
type TestPanelLayout = (typeof panelLayoutOptions)[number];
const accountFilterOptions: AccountFilter[] = ['Active Account', 'Agents', 'Recipients', 'Sponsors', 'All Accounts'];

const buildTestPageFlags = (display: TestPageDisplay) => ({
  TEST_PAGE_EXCHANGE_CONTEXT: display === SP_COIN_DISPLAY.TEST_PAGE_EXCHANGE_CONTEXT,
  TEST_PAGE_FSM_TRACE: display === SP_COIN_DISPLAY.TEST_PAGE_FSM_TRACE,
  TEST_PAGE_ACCOUNT_LISTS: display === SP_COIN_DISPLAY.TEST_PAGE_ACCOUNT_LISTS,
  TEST_PAGE_TO_DOS: display === SP_COIN_DISPLAY.TEST_PAGE_TO_DOS,
});

const getSelectedDisplayFromFlags = (
  flags:
    | {
        TEST_PAGE_EXCHANGE_CONTEXT?: boolean;
        TEST_PAGE_FSM_TRACE?: boolean;
        TEST_PAGE_ACCOUNT_LISTS?: boolean;
        TEST_PAGE_TO_DOS?: boolean;
      }
    | undefined,
): TestPageDisplay | undefined => {
  if (flags?.TEST_PAGE_EXCHANGE_CONTEXT) {
    return SP_COIN_DISPLAY.TEST_PAGE_EXCHANGE_CONTEXT;
  }
  if (flags?.TEST_PAGE_FSM_TRACE) return SP_COIN_DISPLAY.TEST_PAGE_FSM_TRACE;
  if (flags?.TEST_PAGE_ACCOUNT_LISTS) return SP_COIN_DISPLAY.TEST_PAGE_ACCOUNT_LISTS;
  if (flags?.TEST_PAGE_TO_DOS) return SP_COIN_DISPLAY.TEST_PAGE_TO_DOS;
  return undefined;
};

export default function TestPage() {
  const { state, setState } = usePageState();
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { expandContext, setExpandContext, logContext } = useExchangePageState();
  const { dumpNavStack } = usePanelTree();
  const toggleAllRef = useRef<((nextExpand: boolean) => void) | null>(null);
  const pageRootRef = useRef<HTMLDivElement | null>(null);
  const lastWheelToggleAtRef = useRef(0);
  const [headerHeight, setHeaderHeight] = useState(72);
  const [fsmPanelKey, setFsmPanelKey] = useState(0);
  const persistedAccountFilterRaw = (exchangeContext as any)?.settings?.testPage?.accountFilter as
    | AccountFilter
    | undefined;
  const persistedAccountFilter: AccountFilter | undefined = accountFilterOptions.includes(
    persistedAccountFilterRaw as AccountFilter,
  )
    ? (persistedAccountFilterRaw as AccountFilter)
    : undefined;
  const persistedPanelLayoutRaw = (exchangeContext as any)?.settings?.testPage?.panelLayout as
    | TestPanelLayout
    | undefined;
  const persistedPanelLayout: TestPanelLayout = panelLayoutOptions.includes(
    persistedPanelLayoutRaw as TestPanelLayout,
  )
    ? (persistedPanelLayoutRaw as TestPanelLayout)
    : 'Both Open';
  const [walletFilter, setWalletFilter] = useState<AccountFilter>(
    persistedAccountFilter ?? 'All Accounts',
  );
  const [showLeftPanel, setShowLeftPanel] = useState(
    persistedPanelLayout !== 'Right Only',
  );
  const [showRightPanel, setShowRightPanel] = useState(
    persistedPanelLayout !== 'Left Only',
  );

  // Use a loose shape so we can evolve flags without fighting types here
  const pageAny: any = state.page?.exchangePage ?? {};
  const {
    showContext = false,
    showAccounts = false,
    showToDo = false,
    showFSMTracePanel = false,
    selectedTestTab,
  } = pageAny;
  const selectedDisplay = getSelectedDisplayFromFlags(
    exchangeContext?.settings?.testPage,
  );
  const legacySelectedDisplay = (exchangeContext as any)?.settings?.testPage
    ?.selectedDisplay as TestPageDisplay | undefined;
  const selectedDisplayResolved =
    selectedDisplay ??
    legacySelectedDisplay ??
    SP_COIN_DISPLAY.TEST_PAGE_EXCHANGE_CONTEXT;

  const selectedTabFromSettings: TestTab | undefined =
    selectedDisplayResolved === SP_COIN_DISPLAY.TEST_PAGE_EXCHANGE_CONTEXT
      ? 'context'
      : selectedDisplayResolved === SP_COIN_DISPLAY.TEST_PAGE_FSM_TRACE
        ? 'fsm'
        : selectedDisplayResolved === SP_COIN_DISPLAY.TEST_PAGE_ACCOUNT_LISTS
          ? 'wallets'
          : selectedDisplayResolved === SP_COIN_DISPLAY.TEST_PAGE_TO_DOS
            ? 'todo'
            : undefined;

  const setTestPageSelectedDisplay = useCallback(
    (display: TestPageDisplay) => {
      setExchangeContext(
        (prev) => {
          const currentSelected = getSelectedDisplayFromFlags(
            prev.settings?.testPage,
          );
          if (currentSelected === display) return prev;
          return {
            ...prev,
            settings: {
              ...prev.settings,
              testPage: {
                ...((prev.settings?.testPage ?? {}) as any),
                ...buildTestPageFlags(display),
              } as any,
            },
          };
        },
        'TestPage:setTestPageSelectedDisplay',
      );
    },
    [setExchangeContext],
  );

  const setWalletFilterPersisted = useCallback(
    (next: AccountFilter) => {
      setWalletFilter(next);
      setExchangeContext(
        (prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            testPage: {
              ...((prev.settings?.testPage ?? {}) as any),
              accountFilter: next,
            } as any,
          },
        }),
        'TestPage:setWalletFilter',
      );
    },
    [setExchangeContext],
  );

  useEffect(() => {
    if (!persistedAccountFilter) return;
    if (persistedAccountFilter !== walletFilter) {
      setWalletFilter(persistedAccountFilter);
    }
  }, [persistedAccountFilter, walletFilter]);

  useEffect(() => {
    const nextLeft = persistedPanelLayout !== 'Right Only';
    const nextRight = persistedPanelLayout !== 'Left Only';
    if (nextLeft !== showLeftPanel) setShowLeftPanel(nextLeft);
    if (nextRight !== showRightPanel) setShowRightPanel(nextRight);
  }, [persistedPanelLayout]);

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
    showAccounts: false,
    showToDo: false,
    showFSMTracePanel: false,
  } as const;

  const handleQuickSwitch = useCallback(
    (value: string) => {
      if (!value) return;
      let selectedDisplayFlag: TestPageDisplay | undefined;

      switch (value) {
        case 'context':
          selectedDisplayFlag = SP_COIN_DISPLAY.TEST_PAGE_EXCHANGE_CONTEXT;
          updateExchangePage({
            ...resetFlags,
            showContext: true,
            selectedTestTab: 'context',
          });
          break;
        case 'fsm':
          selectedDisplayFlag = SP_COIN_DISPLAY.TEST_PAGE_FSM_TRACE;
          updateExchangePage({
            ...resetFlags,
            showFSMTracePanel: true,
            selectedTestTab: 'fsm',
          });
          break;
        case 'wallets':
          selectedDisplayFlag = SP_COIN_DISPLAY.TEST_PAGE_ACCOUNT_LISTS;
          updateExchangePage({
            ...resetFlags,
            showAccounts: true,
            selectedTestTab: 'wallets',
          });
          break;
        case 'todo':
          selectedDisplayFlag = SP_COIN_DISPLAY.TEST_PAGE_TO_DOS;
          updateExchangePage({
            ...resetFlags,
            showToDo: true,
            selectedTestTab: 'todo',
          });
          break;
        default:
          break;
      }

      if (selectedDisplayFlag !== undefined) {
        setTestPageSelectedDisplay(selectedDisplayFlag);
      }
    },
    [setTestPageSelectedDisplay, updateExchangePage],
  );

  const selectedTab: TestTab =
    selectedTabFromSettings ??
    (selectedTestTab === 'context' ||
    selectedTestTab === 'fsm' ||
    selectedTestTab === 'wallets' ||
    selectedTestTab === 'todo'
      ? selectedTestTab
      : showContext
        ? 'context'
        : showFSMTracePanel
          ? 'fsm'
          : showAccounts
            ? 'wallets'
        : showToDo
              ? 'todo'
              : 'context');
  useEffect(() => {
    // Keep legacy booleans synchronized to selected tab for callers that still read them.
    handleQuickSwitch(selectedTab);
  }, [selectedTab, handleQuickSwitch]);

  const onToggleExpand = useCallback(() => {
    const next = !expandContext;
    setExpandContext(next);
    toggleAllRef.current?.(next);
  }, [expandContext, setExpandContext]);

  const onToggleLeftControl = useCallback(() => {
    setShowLeftPanel(false);
  }, []);
  const onRestoreLeftPanel = useCallback(() => {
    setShowLeftPanel(true);
  }, []);
  const onRestoreRightPanel = useCallback(() => {
    setShowRightPanel(true);
  }, []);
  const onToggleRightControl = useCallback(() => {
    // Keep one panel visible to avoid dead-end UI state.
    if (!showLeftPanel) return;
    setShowRightPanel(false);
  }, [showLeftPanel]);

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

  useEffect(() => {
    const panelLayout: TestPanelLayout =
      showLeftPanel && showRightPanel
        ? 'Both Open'
        : showLeftPanel
          ? 'Left Only'
          : showRightPanel
            ? 'Right Only'
            : 'Both Open';

    setExchangeContext(
      (prev) => {
        const current = (prev.settings?.testPage as any)?.panelLayout as
          | TestPanelLayout
          | undefined;
        if (current === panelLayout) return prev;
        return {
          ...prev,
          settings: {
            ...prev.settings,
            testPage: {
              ...((prev.settings?.testPage ?? {}) as any),
              panelLayout,
            } as any,
          },
        };
      },
      'TestPage:setPanelLayout',
    );
  }, [showLeftPanel, showRightPanel, setExchangeContext]);

  useEffect(() => {
    const root = pageRootRef.current;
    if (!root) return;

    const onWheel = (event: WheelEvent) => {
      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      if (absX < 36 || absX <= absY) return;

      const now = Date.now();
      if (now - lastWheelToggleAtRef.current < 260) return;
      lastWheelToggleAtRef.current = now;

      // Rightward gesture: prefer right side (close left / restore right)
      if (event.deltaX > 0) {
        if (showLeftPanel && showRightPanel) {
          setShowLeftPanel(false);
          return;
        }
        if (!showRightPanel) {
          setShowRightPanel(true);
        }
        return;
      }

      // Leftward gesture: prefer left side (close right / restore left)
      if (showLeftPanel && showRightPanel) {
        setShowRightPanel(false);
        return;
      }
      if (!showLeftPanel) {
        setShowLeftPanel(true);
      }
    };

    root.addEventListener('wheel', onWheel, { passive: true });
    return () => root.removeEventListener('wheel', onWheel);
  }, [showLeftPanel, showRightPanel]);

  return (
    <div
      ref={pageRootRef}
      className="overflow-hidden p-6"
      style={{
        height: `calc(100dvh - ${headerHeight}px)`,
        overflowX: 'hidden',
        overflowY: 'hidden',
      }}
    >
      <div className="flex h-full gap-4 overflow-hidden">
        {!showLeftPanel && showRightPanel && (
          <div className="w-10 shrink-0">
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-center bg-[#192134] pb-2">
              <button
                onClick={onRestoreLeftPanel}
                aria-label="Restore Left Panel"
                title="Restore Left Panel"
                className={panelIconButtonGreen}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                type="button"
              >
                +
              </button>
            </div>
          </div>
        )}
        {showLeftPanel && (
        <div className={`min-w-0 overflow-hidden ${showRightPanel ? 'flex-1' : 'w-full'}`}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 overflow-x-auto whitespace-nowrap bg-[#192134] pb-2">
              <div className="w-10 shrink-0 flex items-center justify-center">
                {showRightPanel && (
                  <button
                    onClick={onToggleLeftControl}
                    aria-label="Close Left Panel"
                    title="Close Left Panel"
                    className={panelIconButtonBlue}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    type="button"
                  >
                    {'\u00D7'}
                  </button>
                )}
              </div>
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
                <option value="wallets">Account Lists</option>
                <option value="todo">ToDo&apos;s</option>
              </select>

              {selectedTab === 'wallets' && (
                <div className="inline-flex flex-1 items-center justify-center gap-3">
                  {accountFilterOptions.map((option) => (
                    <label key={option} className="inline-flex items-center cursor-pointer text-[#5981F3]">
                      <input
                        type="radio"
                        name="testAccountFilter"
                        value={option}
                        checked={walletFilter === option}
                        onChange={() => setWalletFilterPersisted(option)}
                        className="mr-2"
                      />
                      <span className={walletFilter === option ? 'text-green-400' : 'text-[#5981F3]'}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {selectedTab === 'context' && (
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
                <div className="mr-auto inline-flex items-center justify-start gap-2 min-w-0">
                </div>
              )}

            </div>

            <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              {/* Single active tab host with common scroll behavior for all selections. */}
              {selectedTab === 'context' && (
                <ExchangeContextTab
                  onToggleAllReady={(toggleAllFn) => {
                    toggleAllRef.current = toggleAllFn;
                  }}
                />
              )}
              {selectedTab === 'wallets' && (
                <TestWalletsTab
                  selectedFilter={walletFilter}
                  onSelectedFilterChange={setWalletFilterPersisted}
                />
              )}
              {selectedTab === 'fsm' && <FSMTraceTab panelKey={fsmPanelKey} />}
              {selectedTab === 'todo' && <ToDoTab />}
            </div>
          </div>
        </div>
        )}

        {showRightPanel && (
        <div className={`scrollbar-hide min-w-0 overflow-y-auto overflow-x-hidden ${showLeftPanel ? 'flex-1 border-l border-slate-700 pl-2' : 'w-full'}`}>
          <div className="sticky top-0 z-10 mb-4 flex items-center justify-end bg-[#192134] pb-2">
            {showLeftPanel && (
              <div className="w-10 shrink-0 flex items-center justify-center">
                <button
                  onClick={onToggleRightControl}
                  aria-label="Close Right Panel"
                  title="Close Right Panel"
                  className={panelIconButtonBlue}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  type="button"
                >
                  {'\u00D7'}
                </button>
              </div>
            )}
          </div>
          <div className="flex h-full min-h-0 flex-col items-center justify-between pt-12 px-6 pb-4">
            <PriceView />
          </div>
        </div>
        )}
        {!showRightPanel && showLeftPanel && (
          <div className="w-10 shrink-0">
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-center bg-[#192134] pb-2">
              <button
                onClick={onRestoreRightPanel}
                aria-label="Restore Right Panel"
                title="Restore Right Panel"
                className={panelIconButtonGreen}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                type="button"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

