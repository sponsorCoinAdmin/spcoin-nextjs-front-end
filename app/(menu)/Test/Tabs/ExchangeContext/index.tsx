'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';
import { useExchangeContext } from '@/lib/context/hooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { SP_COIN_DISPLAY, FEED_TYPE, TRADE_DIRECTION } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';

import Row from './components/Row';
import Branch from './components/Branch';
import MainPanelsList from './components/MainPanelList';
import { isObjectLike } from './components/utils';

/* ---------- utilities ---------- */
const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

function quoteIfString(v: any) {
  return typeof v === 'string' ? `"${v}"` : String(v);
}

/** Keys → enum objects to pretty-print as key(number): LABEL */
const enumRegistry: Record<string, Record<number, string>> = {
  feedType: FEED_TYPE as unknown as Record<number, string>,
  tradeDirection: TRADE_DIRECTION as unknown as Record<number, string>,
};

export default function ExchangeContextTab() {
  const { exchangeContext } = useExchangeContext();
  const { isVisible, openPanel, closePanel } = usePanelTree();
  const { state, setState } = usePageState();

  const pageAny: any = state.page?.exchangePage ?? {};
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
    updateExchangePage({ showContext: false });
  }, [updateExchangePage]);

  // Helper to collect all expandable paths for the TOP tree's "other branches"
  const collectExpandablePaths = useCallback((value: any, basePath: string, acc: string[]) => {
    if (!isObjectLike(value)) return;
    acc.push(basePath);
    const keys = Array.isArray(value) ? value.map((_, i) => String(i)) : Object.keys(value);
    for (const k of keys) {
      const childVal = Array.isArray(value) ? value[Number(k)] : (value as any)[k];
      collectExpandablePaths(childVal, `${basePath}.${k}`, acc);
    }
  }, []);

  // Expand/Collapse controls TOP tree
  const toggleExpandCollapse = useCallback(() => {
    const nextExpand = !expandContext;
    updateExchangePage({ expandContext: nextExpand });

    const { settings: _omit, ...rest } = (exchangeContext ?? {}) as any;

    if (nextExpand) {
      const paths: string[] = [];
      for (const k of Object.keys(rest)) {
        collectExpandablePaths(rest[k], `rest.${k}`, paths);
      }
      const expMap: Record<string, boolean> = Object.fromEntries(paths.map((p) => [p, true]));
      setUi({ ctx: true, settings: true, main: true, exp: expMap });
    } else {
      setUi({ ctx: false, settings: false, main: false, exp: {} });
    }
  }, [expandContext, exchangeContext, updateExchangePage, collectExpandablePaths]);

  const logContext = useCallback(() => {
    console.log('📦 Log Context (tab):', stringifyBigInt(exchangeContext));
  }, [exchangeContext]);

  /* ---------- derive settings, mainPanel list, and "rest" ---------- */
  const settings = (exchangeContext as any)?.settings ?? {};
  const apiTradingProvider = settings?.apiTradingProvider;
  const mainPanels: any[] = Array.isArray(settings?.mainPanelNode) ? settings.mainPanelNode : [];

  // Raw version (no enum prettifying) for the top tree’s “other branches”
  const restRaw = useMemo(() => {
    const { settings: _omit, ...rest } = (exchangeContext ?? {}) as any;
    return rest;
  }, [exchangeContext]);

  const isMainOverlay = useCallback(
    (p: SP_COIN_DISPLAY) => MAIN_OVERLAY_GROUP.includes(p),
    []
  );

  const onTogglePanel = useCallback(
    (panelId: SP_COIN_DISPLAY) => {
      const visible = isVisible(panelId);
      if (isMainOverlay(panelId)) {
        if (visible && panelId !== SP_COIN_DISPLAY.TRADING_STATION_PANEL) {
          openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
        } else {
          openPanel(panelId);
        }
      } else {
        visible ? closePanel(panelId) : openPanel(panelId);
      }
    },
    [isVisible, isMainOverlay, openPanel, closePanel]
  );

  /* --- expand/collapse state for the first tree --- */
  const [ui, setUi] = useState<{
    ctx: boolean;
    settings: boolean;
    main: boolean;
    exp: Record<string, boolean>; // expansion for “other branches”
  }>({
    ctx: true,
    settings: true,
    main: true,
    exp: {},
  });

  const toggleHeader = useCallback(
    (key: 'ctx' | 'settings' | 'main') => setUi((prev) => ({ ...prev, [key]: !prev[key] })),
    []
  );

  const togglePath = useCallback((path: string) => {
    setUi((prev) => ({ ...prev, exp: { ...prev.exp, [path]: !prev.exp[path] } }));
  }, []);

  const SettingsWithMainPanelNode: React.FC = () => (
    <div className="p-4">
      {/* Headers clickable to expand/collapse */}
      <Row text="Exchange Context" depth={0} open={ui.ctx} clickable onClick={() => toggleHeader('ctx')} />
      {ui.ctx && (
        <>
          <Row text="settings" depth={1} open={ui.settings} clickable onClick={() => toggleHeader('settings')} />
          {ui.settings && (
            <>
              {/* apiTradingProvider line — leaf with blue value */}
              <div className="font-mono whitespace-pre leading-6">
                {'  '.repeat(2)}apiTradingProvider:{' '}
                <span className="text-[#5981F3]">{quoteIfString(apiTradingProvider ?? '')}</span>
              </div>

              <Row
                text="mainPanelNode"
                depth={2}
                open={ui.main}
                clickable
                onClick={() => toggleHeader('main')}
              />
              {ui.main && (
                <MainPanelsList
                  mainPanels={mainPanels}
                  isVisible={isVisible}
                  onTogglePanel={onTogglePanel}
                />
              )}
            </>
          )}

          {/* ───── Additional branches (everything except settings) ───── */}
          {Object.keys(restRaw).map((k) => (
            <Branch
              key={`rest.${k}`}
              label={k}
              value={(restRaw as any)[k]}
              depth={1}
              path={`rest.${k}`}
              exp={ui.exp}
              togglePath={togglePath}
              enumRegistry={enumRegistry}
            />
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="relative w-full -mt-[15px]">
        <div className="flex flex-wrap items-center justify-center gap-4 py-2">
          <button onClick={toggleExpandCollapse} className={buttonClasses}>
            {expandContext ? 'Collapse Context' : 'Expand Context'}
          </button>

          <button onClick={logContext} className={buttonClasses}>
            Log Context
          </button>
        </div>

        {/* Close */}
        <button
          onClick={hideContext}
          aria-label="Close Context"
          title="Close Context"
          className="absolute top-1 right-1 h-10 w-10 rounded-full bg-[#243056] text-[#5981F3] flex items-center justify-center leading-none
                     hover:bg-[#5981F3] hover:text-[#243056] transition-colors text-3xl"
          type="button"
        >
          ×
        </button>
      </div>

      {/* Top tree only (no border) */}
      <SettingsWithMainPanelNode />
    </div>
  );
}
