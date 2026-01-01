// File: @/app/(menu)/Test/Tabs/ExchangeContext/hooks/useExpandCollapse.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { filterPaths, loadExCtxMap, saveExCtxMap } from '../utils/exCtxMapStorage';

/** Treat arrays as branch nodes (not just plain objects) */
function isBranchNode(val: any): boolean {
  return val !== null && typeof val === 'object';
}

/**
 * Discover ALL expandable branch paths so exCtxMap stays in sync with the UI:
 *  - rest.settings
 *  - rest.settings.spCoinPanelTree (array)
 *  - every panel item:                      rest.settings.spCoinPanelTree.N
 *  - every children container:              rest.settings.spCoinPanelTree.N.children
 *  - nested children recursively:           …children.M, …children.M.children, …
 *  - ✅ other settings branches (e.g. displayStack) via generic walk
 *  - everything else under rest.*
 */
function discoverNonPanelPaths(exchangeContext: any): Set<string> {
  const found = new Set<string>();

  const add = (path: string, value: any) => {
    if (!isBranchNode(value)) return;
    found.add(path);
  };

  // Generic walker for objects/arrays
  const walk = (val: any, basePath: string) => {
    if (!isBranchNode(val)) return;
    add(basePath, val);

    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        walk(val[i], `${basePath}.${i}`);
      }
    } else {
      for (const k of Object.keys(val)) {
        walk(val[k], `${basePath}.${k}`);
      }
    }
  };

  // settings + spCoinPanelTree (+ children recursion)
  const settings = (exchangeContext ?? {}).settings;
  if (isBranchNode(settings)) {
    add('rest.settings', settings);

    const main = (settings as any).spCoinPanelTree;
    if (Array.isArray(main)) {
      add('rest.settings.spCoinPanelTree', main);

      const walkPanels = (arr: any[], basePath: string) => {
        for (let i = 0; i < arr.length; i++) {
          const item = arr[i];
          const itemPath = `${basePath}.${i}`;
          add(itemPath, item);

          const children = item?.children;
          if (Array.isArray(children)) {
            const childrenPath = `${itemPath}.children`;
            add(childrenPath, children);
            walkPanels(children, childrenPath);
          }
        }
      };

      walkPanels(main, 'rest.settings.spCoinPanelTree');
    }

    // ✅ ALSO discover any other expandable settings branches (e.g. displayStack)
    // We skip spCoinPanelTree here because it’s already handled above (with special children rules).
    if (!Array.isArray(settings)) {
      for (const k of Object.keys(settings)) {
        if (k === 'spCoinPanelTree') continue;
        walk((settings as any)[k], `rest.settings.${k}`);
      }
    }
  }

  // everything except settings under rest.*
  const rest: Record<string, any> = (() => {
    const { settings: _omit, ...restObj } = (exchangeContext ?? {}) as any;
    return restObj;
  })();

  for (const k of Object.keys(rest)) {
    walk(rest[k], `rest.${k}`);
  }

  return found;
}

type UI = { ctx: boolean; settings: boolean; main: boolean; exp: Record<string, boolean> };

/**
 * Maintains the UI expansion map for ALL branches (independent of visibility).
 * Persists to localStorage in 'exCtxMap', prunes stale paths as ExchangeContext changes.
 */
export function useExpandCollapse(exchangeContext: any, _expandedInit: boolean) {
  const [ui, setUi] = useState<UI>({ ctx: true, settings: true, main: true, exp: {} });

  // everything but settings (for rendering)
  const restRaw = useMemo(() => {
    const { settings: _omit, ...rest } = (exchangeContext ?? {}) as any;
    return rest;
  }, [exchangeContext]);

  // discover current branch paths
  const allowedPaths = useMemo(() => discoverNonPanelPaths(exchangeContext), [exchangeContext]);

  // hydrate UI.exp on exchangeContext changes: defaults → saved (filtered to allowed)
  const hydratedRef = useRef(false);
  useEffect(() => {
    const defaults: Record<string, boolean> = {
      'rest.settings': true,
      'rest.settings.spCoinPanelTree': true,
      // NOTE: we do NOT auto-expand displayStack by default, but it is now expandable.
    };

    const stored = loadExCtxMap();
    const restored = filterPaths(stored, allowedPaths);

    setUi((prev) => ({
      ...prev,
      exp: { ...defaults, ...restored },
    }));

    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedPaths]);

  // persist exp to localStorage whenever it changes after hydration
  useEffect(() => {
    if (!hydratedRef.current) return;
    const pruned: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(ui.exp)) {
      if (allowedPaths.has(k)) pruned[k] = !!v;
    }
    const shapeSig = Array.from(allowedPaths).sort().join('|');
    saveExCtxMap(pruned, shapeSig);
  }, [ui.exp, allowedPaths]);

  // expand/collapse all (UI-only)
  const toggleAll = useCallback(
    (nextExpand: boolean) => {
      if (nextExpand) {
        const expAll: Record<string, boolean> = {};
        for (const p of allowedPaths) expAll[p] = true;
        setUi({ ctx: true, settings: true, main: true, exp: expAll });
      } else {
        setUi({ ctx: false, settings: false, main: false, exp: {} });
      }
    },
    [allowedPaths],
  );

  // toggle an individual path (UI-only)
  const togglePath = useCallback(
    (path: string) => {
      if (!allowedPaths.has(path)) return;
      setUi((prev) => ({ ...prev, exp: { ...prev.exp, [path]: !prev.exp[path] } }));
    },
    [allowedPaths],
  );

  // header toggles (UI only)
  const setHeader = useCallback((key: 'ctx' | 'settings' | 'main') => {
    setUi((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return { ui, setHeader, toggleAll, togglePath, restRaw };
}
