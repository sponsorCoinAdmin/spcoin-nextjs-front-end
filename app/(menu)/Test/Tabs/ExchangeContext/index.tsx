// File: app/(menu)/Test/Tabs/ExchangeContext/index.tsx

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { usePageState } from '@/lib/context/PageStateContext';
import { useExchangeContext } from '@/lib/context/hooks';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { SP_COIN_DISPLAY, FEED_TYPE, TRADE_DIRECTION } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { MAIN_OVERLAY_GROUP } from '@/lib/structure/exchangeContext/constants/spCoinDisplay';

/* ──────────────────────────────────────────────────────────────────────────
   Colored marker components
   [+] → green   |   [-] → orange
   Use these everywhere a marker is shown.
─────────────────────────────────────────────────────────────────────────── */
const PlusMarker: React.FC<{ onClick?: () => void; title?: string; className?: string }> = ({
  onClick,
  title = 'Expand',
  className = '',
}) => (
  <button
    type="button"
    className={`inline-block mr-1 underline-offset-2 hover:underline text-[#22c55e] ${className}`}
    onClick={onClick}
    aria-label="Expand"
    title={title}
  >
    [+]
  </button>
);

const MinusMarker: React.FC<{ onClick?: () => void; title?: string; className?: string }> = ({
  onClick,
  title = 'Collapse',
  className = '',
}) => (
  <button
    type="button"
    className={`inline-block mr-1 underline-offset-2 hover:underline text-[#f59e0b] ${className}`}
    onClick={onClick}
    aria-label="Collapse"
    title={title}
  >
    [-]
  </button>
);

/* ---------- utilities ---------- */
const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

function isObjectLike(v: any) {
  return v !== null && typeof v === 'object';
}

function quoteIfString(v: any) {
  return typeof v === 'string' ? `"${v}"` : String(v);
}

/** Keys → enum objects to pretty-print as key(number): LABEL */
const enumRegistry: Record<string, Record<number, string>> = {
  feedType: FEED_TYPE as unknown as Record<number, string>,
  tradeDirection: TRADE_DIRECTION as unknown as Record<number, string>,
};

/* ------------------------------------------ */

export default function ExchangeContextTab() {
  const { exchangeContext } = useExchangeContext();
  const { isVisible, openPanel, closePanel, getPanelChildren } = usePanelTree();
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
    exp: Record<string, boolean>; // expansion for “other branches” by path (and panel children)
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

  const Row: React.FC<{
    text: string;
    depth: number;
    open?: boolean;
    clickable?: boolean;
    onClick?: () => void;
  }> = ({ text, depth, open, clickable, onClick }) => {
    const indent = '  '.repeat(depth);
    const colorClass = open === undefined ? 'text-slate-200' : open ? 'text-green-400' : 'text-orange-400';

    const markerEl =
      open === undefined ? (
        <MinusMarker className="pointer-events-none" />
      ) : open ? (
        <MinusMarker className={clickable ? '' : 'cursor-default'} onClick={clickable ? onClick : undefined} />
      ) : (
        <PlusMarker className={clickable ? '' : 'cursor-default'} onClick={clickable ? onClick : undefined} />
      );

    return (
      <div className={`font-mono whitespace-pre leading-6 ${colorClass}`}>
        {indent}
        {markerEl}
        {text}
      </div>
    );
  };

  /* ---------- generic branch renderer for the top tree (other keys) ---------- */
  const Branch: React.FC<{ label: string; value: any; depth: number; path: string }> = ({
    label,
    value,
    depth,
    path,
  }) => {
    if (isObjectLike(value)) {
      const expanded = !!ui.exp[path];
      const keys = Array.isArray(value) ? value.map((_, i) => String(i)) : Object.keys(value);
      return (
        <>
          <Row
            text={label}
            depth={depth}
            open={expanded}
            clickable
            onClick={() => togglePath(path)}
          />
          {expanded &&
            keys.map((k) => {
              const childPath = `${path}.${k}`;
              const childVal = Array.isArray(value) ? value[Number(k)] : (value as any)[k];
              const childLabel = Array.isArray(value) ? `[${k}]` : k;
              return (
                <Branch
                  key={childPath}
                  label={childLabel}
                  value={childVal}
                  depth={depth + 1}
                  path={childPath}
                />
              );
            })}
        </>
      );
    }

    // Primitive leaf:
    // If key is in enumRegistry and value is a number with a label, show: key(number): LABEL (blue)
    const enumForKey = enumRegistry[label];
    if (enumForKey && typeof value === 'number') {
      const enumLabel = enumForKey[value];
      const pretty = typeof enumLabel === 'string' ? enumLabel : `[${value}]`;
      return (
        <div className="font-mono whitespace-pre leading-6 text-slate-200">
          {'  '.repeat(depth)}
          {`${label}(${value}): `}<span className="text-[#5981F3]">{pretty}</span>
        </div>
      );
    }

    // Default leaf with blue value
    return (
      <div className="font-mono whitespace-pre leading-6 text-slate-200">
        {'  '.repeat(depth)}
        {`${label}: `}<span className="text-[#5981F3]">{quoteIfString(value)}</span>
      </div>
    );
  };

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
                <>
                  {mainPanels.map((node, idx) => {
                    if (!node) return null;
                    const panelId: SP_COIN_DISPLAY =
                      typeof node.panel === 'number' ? node.panel : (idx as SP_COIN_DISPLAY);
                    const visible = isVisible(panelId);
                    const label = SP_COIN_DISPLAY[panelId] ?? `PANEL_${panelId}`;

                    // Children are now read from settings.panelChildren (persistent graph)
                    const childrenPath = `settings.panelChildren.${panelId}`;
                    const childrenExpanded = !!ui.exp[childrenPath];
                    const childIds = getPanelChildren(panelId);

                    return (
                      <React.Fragment key={idx}>
                        <Row
                          text={`${idx} → ${label}`}
                          depth={3}
                          open={visible}
                          clickable
                          onClick={() => onTogglePanel(panelId)}
                        />
                        {visible && (
                          <>
                            {/* TOGGLABLE children row */}
                            <Row
                              text={`children`}
                              depth={4}
                              open={childrenExpanded}
                              clickable
                              onClick={() => togglePath(childrenPath)}
                            />
                            {childrenExpanded && (
                              <>
                                {childIds.length > 0 ? (
                                  childIds.map((childId, cIdx) => {
                                    const chLabel = SP_COIN_DISPLAY[childId] ?? `PANEL_${childId}`;
                                    return (
                                      <div
                                        key={`${childrenPath}.${cIdx}`}
                                        className="font-mono whitespace-pre leading-6 text-slate-200"
                                      >
                                        {'  '.repeat(5)}
                                        {`[${cIdx}] → ${chLabel}`}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="font-mono whitespace-pre leading-6 text-slate-400">
                                    {'  '.repeat(5)}(empty)
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* ───── Additional branches (everything except settings) ───── */}
          {Object.keys(restRaw).map((k) => (
            <Branch key={`rest.${k}`} label={k} value={(restRaw as any)[k]} depth={1} path={`rest.${k}`} />
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
