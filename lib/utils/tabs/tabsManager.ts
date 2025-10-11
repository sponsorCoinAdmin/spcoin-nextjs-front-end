// File: lib/utils/tabs/tabsManager.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TabId, TabMeta } from './registry';
import { getTabById, TAB_REGISTRY, DEFAULT_FALLBACK_TAB_ID, PATH_TO_ID } from './registry';

/** Keep this key identical to what the header uses */
export const STORAGE_KEY = 'header_open_tabs';

/* Build typed registry snapshots once */
const ALL_TAB_META = Object.values(TAB_REGISTRY) as TabMeta[];

/* Use the same storage medium as the header: sessionStorage */
function readIdsFromStorage(): TabId[] {
  if (typeof window === 'undefined') return [DEFAULT_FALLBACK_TAB_ID];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [DEFAULT_FALLBACK_TAB_ID];

    const idsUnknown = JSON.parse(raw) as unknown;
    if (!Array.isArray(idsUnknown)) return [DEFAULT_FALLBACK_TAB_ID];

    const known = new Set<TabId>(ALL_TAB_META.map(t => t.id));
    const cleaned = (idsUnknown as string[]).filter((id): id is TabId => known.has(id as TabId));
    return cleaned.length ? cleaned : [DEFAULT_FALLBACK_TAB_ID];
  } catch {
    return [DEFAULT_FALLBACK_TAB_ID];
  }
}

function writeIdsToStorage(ids: TabId[]) {
  if (typeof window === 'undefined') return;
  const unique = Array.from(new Set(ids));
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
}

/* Notify the existing header listeners for immediate UI sync */
function dispatchAdd(href: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('header:add-tab', { detail: { href } }));
}
function dispatchRemove(href: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('header:remove-tab', { detail: { href } }));
}

/* ─────────────────────────────────────────────────────────────
   Headless API (callable from any client module)
────────────────────────────────────────────────────────────── */
export function openTab(
  id: TabId,
  opts?: { navigate?: boolean; router?: { push: (href: string) => void } }
): void {
  const meta = getTabById(id);
  const ids = readIdsFromStorage();
  if (!ids.includes(id)) {
    const next: TabId[] = [...ids, id];
    writeIdsToStorage(next);
    dispatchAdd(meta.path);
  }
  if (opts?.navigate !== false && opts?.router) {
    opts.router.push(meta.path);
  }
}

export function closeTab(
  id: TabId,
  opts?: {
    navigate?: boolean;
    router?: { push: (href: string) => void };
    fallbackId?: TabId;
    currentId?: TabId; // pass the currently active tab id (if you have it)
  }
): void {
  const meta = getTabById(id);
  const ids = readIdsFromStorage();
  if (!ids.includes(id)) return; // idempotent

  const next: TabId[] = ids.filter(tid => tid !== id);
  writeIdsToStorage(next);
  dispatchRemove(meta.path);

  const shouldNavigate = opts?.navigate !== false && !!opts?.router;
  if (!shouldNavigate) return;

  const closingActive = opts?.currentId ? opts.currentId === id : false;
  if (!closingActive) return;

  const fallbackId = opts?.fallbackId ?? DEFAULT_FALLBACK_TAB_ID;
  const targetId: TabId = next.length ? next[next.length - 1] : fallbackId;
  const targetMeta = getTabById(targetId);
  opts.router!.push(targetMeta.path);
}

/* Convenience reads */
export function listOpenTabs(): TabId[] {
  return readIdsFromStorage();
}
export function isTabOpen(id: TabId): boolean {
  return readIdsFromStorage().includes(id);
}

/* Optional convenience: open/close by href (path) */
export function openTabByHref(href: string, opts?: { navigate?: boolean; router?: { push: (href: string) => void } }) {
  const id = PATH_TO_ID[href];
  if (id) openTab(id, opts);
}
export function closeTabByHref(href: string, opts?: Parameters<typeof closeTab>[1]) {
  const id = PATH_TO_ID[href];
  if (id) closeTab(id, opts);
}

/* ─────────────────────────────────────────────────────────────
   React hook (optional, for components that want live state)
────────────────────────────────────────────────────────────── */
export function useTabs() {
  const [ids, setIds] = useState<TabId[]>(() => readIdsFromStorage());

  useEffect(() => {
    const onAdd = (e: Event) => {
      const href = (e as CustomEvent).detail?.href as string | undefined;
      if (!href) return;
      const id = PATH_TO_ID[href];
      if (!id) return;
      setIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    };
    const onRemove = (e: Event) => {
      const href = (e as CustomEvent).detail?.href as string | undefined;
      if (!href) return;
      const id = PATH_TO_ID[href];
      if (!id) return;
      setIds(prev => prev.filter(x => x !== id));
    };

    window.addEventListener('header:add-tab', onAdd as EventListener);
    window.addEventListener('header:remove-tab', onRemove as EventListener);
    return () => {
      window.removeEventListener('header:add-tab', onAdd as EventListener);
      window.removeEventListener('header:remove-tab', onRemove as EventListener);
    };
  }, []);

  const tabs: TabMeta[] = useMemo(() => {
    const index: Record<string, TabMeta> = (Object.values(TAB_REGISTRY) as TabMeta[])
      .reduce((acc, t) => { acc[t.id] = t; return acc; }, {} as Record<string, TabMeta>);
    return ids.map(id => index[id]).filter(Boolean);
  }, [ids]);

  const add = useCallback((id: TabId) => {
    if (ids.includes(id)) return;
    const next: TabId[] = [...ids, id];
    setIds(next);
    writeIdsToStorage(next);
    dispatchAdd(getTabById(id).path);
  }, [ids]);

  const remove = useCallback((id: TabId) => {
    if (!ids.includes(id)) return;
    const next: TabId[] = ids.filter(x => x !== id);
    setIds(next);
    writeIdsToStorage(next);
    dispatchRemove(getTabById(id).path);
  }, [ids]);

  const isOpen = useCallback((id: TabId) => ids.includes(id), [ids]);

  return { ids, tabs, add, remove, isOpen };
}
