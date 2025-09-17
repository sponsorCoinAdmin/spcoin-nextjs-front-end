// File: app/(menu)/Test/Tabs/ExchangeContext/hooks/useExpandCollapse.ts
'use client';

import { useCallback, useMemo, useState } from 'react';
import { isObjectLike } from '../utils/object';

type UI = { ctx: boolean; settings: boolean; main: boolean; exp: Record<string, boolean> };

export function useExpandCollapse(exchangeContext: any, _expandedInit: boolean) {
  const [ui, setUi] = useState<UI>({ ctx: true, settings: true, main: true, exp: {} });

  const restRaw = useMemo(() => {
    const { settings: _omit, ...rest } = (exchangeContext ?? {}) as any;
    return rest;
  }, [exchangeContext]);

  const collect = useCallback((value: any, basePath: string, acc: string[]) => {
    if (!isObjectLike(value)) return;
    acc.push(basePath);
    const keys = Array.isArray(value) ? value.map((_, i) => String(i)) : Object.keys(value);
    for (const k of keys) {
      collect(Array.isArray(value) ? value[Number(k)] : (value as any)[k], `${basePath}.${k}`, acc);
    }
  }, []);

  const toggleAll = useCallback(
    (nextExpand: boolean) => {
      if (nextExpand) {
        const paths: string[] = [];
        for (const k of Object.keys(restRaw)) collect((restRaw as any)[k], `rest.${k}`, paths);
        const expMap = Object.fromEntries(paths.map((p) => [p, true]));
        setUi({ ctx: true, settings: true, main: true, exp: expMap });
      } else {
        setUi({ ctx: false, settings: false, main: false, exp: {} });
      }
    },
    [restRaw, collect]
  );

  const setHeader = useCallback((key: 'ctx' | 'settings' | 'main') => {
    setUi((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const togglePath = useCallback((path: string) => {
    setUi((prev) => ({ ...prev, exp: { ...prev.exp, [path]: !prev.exp[path] } }));
  }, []);

  return { ui, setHeader, toggleAll, togglePath, restRaw };
}
