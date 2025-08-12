// File: app/(menu)/Test/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { useExchangeContext } from '@/lib/context/hooks';
import { usePageState } from '@/lib/context/PageStateContext';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { SP_COIN_DISPLAY } from '@/lib/structure';

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
  const { address } = useAccount();
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { state, setState } = usePageState();

  const pageAny: any = state.page?.exchangePage ?? {};
  const {
    showContext = false,
    showWallets = false,
    collapsedKeys = [],
    expandContext = false,
    showActiveDisplayPanel = false,
    showPanels = false,
    showToDo = false,
  } = pageAny;

  const [showFSMTracePanel, setShowFSMTracePanel] = useState(false);
  const [quickSwitch, setQuickSwitch] = useState<string>(''); // select value
  const [showQuickSwitch, setShowQuickSwitch] = useState<boolean>(true); // controls dropdown visibility

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
        });
        setShowFSMTracePanel(false);
        break;
      case 'fsm':
        setShowFSMTracePanel(true);
        updateExchangePage({
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
        });
        setShowFSMTracePanel(false);
        break;
      case 'panels':
        updateExchangePage({
          showPanels: true,
          showContext: false,
          showActiveDisplayPanel: false,
          expandContext: false,
          showWallets: false,
          showToDo: false,
        });
        setShowFSMTracePanel(false);
        break;
      case 'todo':
        updateExchangePage({
          showToDo: true,
          showContext: false,
          showActiveDisplayPanel: false,
          expandContext: false,
          showWallets: false,
          showPanels: false,
        });
        setShowFSMTracePanel(false);
        break;
      default:
        break;
    }
    // Clear selection and hide the quick switch until user hides a panel
    setQuickSwitch('');
    setShowQuickSwitch(false);
  }, [updateExchangePage]);

  // HIDE handlers (also re-show the Run Test dropdown)
  const hideContext = useCallback(() => {
    updateExchangePage({ showContext: false, showActiveDisplayPanel: false });
    setShowQuickSwitch(true);
  }, [updateExchangePage]);

  const hideWallets = useCallback(() => {
    updateExchangePage({ showWallets: false });
    setShowQuickSwitch(true);
  }, [updateExchangePage]);

  const hideFSMTrace = useCallback(() => {
    setShowFSMTracePanel(false);
    setShowQuickSwitch(true);
  }, []);

  const hidePanels = useCallback(() => {
    updateExchangePage({ showPanels: false });
    setShowQuickSwitch(true);
  }, [updateExchangePage]);

  const hideToDo = useCallback(() => {
    updateExchangePage({ showToDo: false });
    setShowQuickSwitch(true);
  }, [updateExchangePage]);

  const getAllNestedKeys = useCallback((obj: any): string[] => {
    let keys: string[] = [];
    if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([k, v]) => {
        keys.push(k);
        if (typeof v === 'object' && v !== null) {
          keys.push(...getAllNestedKeys(v));
        }
      });
    }
    return keys;
  }, []);

  const toggleExpandCollapse = useCallback(() => {
    const nextExpand = !expandContext;
    const nextKeys = nextExpand ? [] : getAllNestedKeys(exchangeContext);
    updateExchangePage({
      expandContext: nextExpand,
      collapsedKeys: nextKeys,
    });
  }, [expandContext, getAllNestedKeys, exchangeContext, updateExchangePage]);

  const logContext = useCallback(() => {
    const ctx = stringifyBigInt(exchangeContext);
    console.log('📦 Log Context:', ctx);
  }, [exchangeContext]);

  return (
    <div className="space-y-6 p-6">
      {isHydrated && (
        <>
          {/* Centered "Run Test" dropdown (hidden after a selection until a Hide button is clicked) */}
          {showQuickSwitch && (
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
          )}

          {/* Button row: centered; only "Hide ..." buttons for visible sections */}
          <div className="w-full flex flex-wrap justify-center gap-4">
            {showContext && (
              <>
                <button onClick={hideContext} className={buttonClasses}>
                  Hide Context
                </button>
                <button onClick={toggleExpandCollapse} className={buttonClasses}>
                  {expandContext ? 'Collapse Context' : 'Expand Context'}
                </button>
                <button onClick={logContext} className={buttonClasses}>
                  Log Context
                </button>
              </>
            )}

            {showActiveDisplayPanel && showContext && (
              <select
                id="activeDisplaySelect"
                title="Select activeDisplay"
                aria-label="Select activeDisplay"
                value={exchangeContext.settings.activeDisplay}
                onChange={(e) => {
                  const selected = Number(e.target.value);
                  setExchangeContext((prev: any) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
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
            )}

            {showFSMTracePanel && (
              <button onClick={hideFSMTrace} className={buttonClasses}>
                Hide FSM Trace
              </button>
            )}

            {showWallets && (
              <button onClick={hideWallets} className={buttonClasses}>
                Hide Test Wallets
              </button>
            )}

            {showPanels && (
              <button onClick={hidePanels} className={buttonClasses}>
                Hide Panels
              </button>
            )}

            {showToDo && (
              <button onClick={hideToDo} className={buttonClasses}>
                Hide ToDo
              </button>
            )}
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
