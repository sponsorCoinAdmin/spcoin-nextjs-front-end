// File: lib/utils/tabs/tabsManager.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TabId, TabMeta } from './registry';
import { getTabById, TAB_REGISTRY, DEFAULT_FALLBACK_TAB_ID, PATH_TO_ID } from './registry';

/** Must match the header */
export const STORAGE_KEY = 'header_open_tabs';

/* Snapshot registry */
const ALL_TAB_META = Object.values(TAB_REGISTRY) as TabMeta[];

/* ─────────────────────────────────────────────────────────────
   STORAGE USES HREFs (paths), not TabIds — matches the header
────────────────────────────────────────────────────────────── */
function readHrefsFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    const knownPaths = new Set(ALL_TAB_META.map(t => t.path));
    const cleaned = (parsed as unknown[]).filter(
      (p): p is string => typeof p === 'string' && knownPaths.has(p)
    );
    return Array.from(new Set(cleaned));
  } catch {
    return [];
  }
}

function writeHrefsToStorage(hrefs: string[]) {
  if (typeof window === 'undefined') return;
  const unique = Array.from(new Set(hrefs));
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
}

/* Notify header to refresh immediately */
function dispatchAdd(href: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('header:add-tab', { detail: { href } }));
}
function dispatchRemove(href: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('header:remove-tab', { detail: { href } }));
}

/* ─────────────────────────────────────────────────────────────
   Headless API (callable anywhere in client code)
   - Storage is HREFs; convert to/from ids as needed.
────────────────────────────────────────────────────────────── */
export function openTab(
  id: TabId,
  opts?: { navigate?: boolean; router?: { push: (href: string) => void } }
): void {
  const href = getTabById(id).path;
  const hrefs = readHrefsFromStorage();
  if (!hrefs.includes(href)) {
    const next = [...hrefs, href];
    writeHrefsToStorage(next);
    dispatchAdd(href);
  }
  if (opts?.navigate !== false && opts?.router) {
    opts.router.push(href);
  }
}

export function closeTab(
  id: TabId,
  opts?: {
    navigate?: boolean;
    router?: { push: (href: string) => void };
    fallbackId?: TabId;
    currentId?: TabId; // pass if you're closing the active tab
  }
): void {
  const href = getTabById(id).path;
  const hrefs = readHrefsFromStorage();
  if (!hrefs.includes(href)) return; // idempotent

  const next = hrefs.filter(h => h !== href);
  writeHrefsToStorage(next);
  dispatchRemove(href);

  const shouldNavigate = opts?.navigate !== false && !!opts?.router;
  const closingActive = opts?.currentId ? opts.currentId === id : false;
  if (!shouldNavigate || !closingActive) return;

  const fallbackId = opts?.fallbackId ?? DEFAULT_FALLBACK_TAB_ID;
  const targetHref = next.length ? next[next.length - 1] : getTabById(fallbackId).path;
  opts.router!.push(targetHref);
}

/* Convenience: open/close by href directly */
export function openTabByHref(href: string, opts?: { navigate?: boolean; router?: { push: (href: string) => void } }) {
  const id = PATH_TO_ID[href];
  if (id) openTab(id, opts);
}
export function closeTabByHref(href: string, opts?: Parameters<typeof closeTab>[1]) {
  const id = PATH_TO_ID[href];
  if (id) closeTab(id, opts);
}

/* Reads */
export function listOpenTabs(): TabId[] {
  const hrefs = readHrefsFromStorage();
  const ids: TabId[] = hrefs.map(h => PATH_TO_ID[h]).filter(Boolean) as TabId[];
  return ids;
}
export function listOpenTabHrefs(): string[] {
  return readHrefsFromStorage();
}
export function isTabOpen(id: TabId): boolean {
  const href = getTabById(id).path;
  return readHrefsFromStorage().includes(href);
}

/* ─────────────────────────────────────────────────────────────
   React hook (optional, for components that want live state)
────────────────────────────────────────────────────────────── */
export function useTabs() {
  const [hrefs, setHrefs] = useState<string[]>(() => readHrefsFromStorage());

  useEffect(() => {
    const onAdd = (e: Event) => {
      const href = (e as CustomEvent).detail?.href as string | undefined;
      if (!href) return;
      setHrefs(prev => (prev.includes(href) ? prev : [...prev, href]));
    };
    const onRemove = (e: Event) => {
      const href = (e as CustomEvent).detail?.href as string | undefined;
      if (!href) return;
      setHrefs(prev => prev.filter(x => x !== href));
    };

    window.addEventListener('header:add-tab', onAdd as EventListener);
    window.addEventListener('header:remove-tab', onRemove as EventListener);
    return () => {
      window.removeEventListener('header:add-tab', onAdd as EventListener);
      window.removeEventListener('header:remove-tab', onRemove as EventListener);
    };
  }, []);

  const tabs: TabMeta[] = useMemo(() => {
    const byPath = new Map<string, TabMeta>(ALL_TAB_META.map(t => [t.path, t]));
    return hrefs.map(h => byPath.get(h)).filter(Boolean) as TabMeta[];
  }, [hrefs]);

  const add = useCallback((id: TabId) => {
    const href = getTabById(id).path;
    setHrefs(prev => {
      if (prev.includes(href)) return prev;
      const next = [...prev, href];
      writeHrefsToStorage(next);
      dispatchAdd(href);
      return next;
    });
  }, []);

  const remove = useCallback((id: TabId) => {
    const href = getTabById(id).path;
    setHrefs(prev => {
      if (!prev.includes(href)) return prev;
      const next = prev.filter(x => x !== href);
      writeHrefsToStorage(next);
      dispatchRemove(href);
      return next;
    });
  }, []);

  const isOpen = useCallback((id: TabId) => {
    const href = getTabById(id).path;
    return hrefs.includes(href);
  }, [hrefs]);

  return { hrefs, tabs, add, remove, isOpen };
}
