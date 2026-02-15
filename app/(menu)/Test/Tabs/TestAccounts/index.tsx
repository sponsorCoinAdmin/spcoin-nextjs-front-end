// File: app/(menu)/Test/Tabs/TestAccounts/index.tsx

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useExchangeContext } from '@/lib/context/hooks';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import agentJsonList from '@/resources/data/mockFeeds/accounts/agents/accounts.json';
import recipientJsonList from '@/resources/data/mockFeeds/accounts/recipients/accounts.json';
import sponsorJsonList from '@/resources/data/mockFeeds/accounts/sponsors/accounts.json';
import type { spCoinAccount } from '@/lib/structure';
import { defaultMissingImage, getAccountLogo } from '@/lib/context/helpers/assetHelpers';
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import AddressSelect from '@/components/views/AssetSelectPanels/AddressSelect';
import { SP_COIN_DISPLAY } from '@/lib/structure';

const accontOptions = ['Active Account', 'Agents', 'Recipients', 'Sponsors', 'All Accounts'] as const;
export type AccountFilter = (typeof accontOptions)[number];

type AccountsPageProps = {
  activeAccountText?: string;
  activeAccount?: spCoinAccount | null;
  selectedFilter?: AccountFilter;
  onSelectedFilterChange?: (next: AccountFilter) => void;
  showFilterControls?: boolean;
};

function AccountsPage({
  activeAccountText,
  activeAccount,
  selectedFilter,
  onSelectedFilterChange,
  showFilterControls = true,
}: AccountsPageProps) {
  const [accontCache, setAccontCache] = useState<Record<string, spCoinAccount[]>>({
    'Active Account': [],
    All: [],
    Recipients: [],
    Agents: [],
    Sponsors: [],
  });

  const [internalTypeOfAcconts, setInternalTypeOfAcconts] =
    useState<AccountFilter>('All Accounts');
  const typeOfAcconts = selectedFilter ?? internalTypeOfAcconts;
  const setTypeOfAcconts = onSelectedFilterChange ?? setInternalTypeOfAcconts;
  const [acconts, setAcconts] = useState<spCoinAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);
  const isFetchingNextRef = useRef(false);
  const PAGE_SIZE = 25;

  const fetchAllAccontsPage = async (nextPage: number, replace = false) => {
    if (nextPage <= 1) setLoading(true);
    else setLoadingMore(true);
    setErr(null);

    try {
      const res = await fetch(
        `/api/spCoin/accounts?allData=true&page=${nextPage}&pageSize=${PAGE_SIZE}`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error(`Failed to fetch acconts: ${res.status}`);
      const payload = await res.json();
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const mapped: spCoinAccount[] = items
        .map((item: any) => {
          const data = item?.data;
          const address = item?.address;
          if (!data || typeof data !== 'object') return null;
          return {
            ...data,
            address: typeof data.address === 'string' ? data.address : address,
          } as spCoinAccount;
        })
        .filter(Boolean);

      setAcconts((prev) => {
        if (replace) return mapped;
        const seen = new Set(prev.map((a) => a.address?.toLowerCase?.() ?? ''));
        const merged = [...prev];
        for (const accont of mapped) {
          const key = accont.address?.toLowerCase?.() ?? '';
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(accont);
          }
        }
        return merged;
      });
      setPage(Number(payload?.page ?? nextPage));
      setHasNextPage(Boolean(payload?.hasNextPage));
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to get acconts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingNextRef.current = false;
    }
  };

  const fetchAcconts = async (forceReload = false) => {
    setErr(null);

    if (typeOfAcconts === 'Active Account') {
      const next = activeAccount ? [activeAccount] : [];
      setAcconts(next);
      setHasNextPage(false);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (typeOfAcconts === 'All Accounts') {
      if (!forceReload && acconts.length > 0) return;
      setPage(1);
      setHasNextPage(false);
      await fetchAllAccontsPage(1, true);
      return;
    }

    if (!forceReload && accontCache[typeOfAcconts]?.length > 0) {
      setAcconts(accontCache[typeOfAcconts]);
      return;
    }

    setLoading(true);

    let accountList: string[] = [];

    switch (typeOfAcconts) {
      case 'Recipients':
        accountList = recipientJsonList as string[];
        break;
      case 'Agents':
        accountList = agentJsonList as string[];
        break;
      case 'Sponsors':
        accountList = sponsorJsonList as string[];
        break;
      default:
        accountList = [];
        break;
    }

    let cancelled = false;
    try {
      const downloadedAcconts = await loadAccounts(accountList);
      if (cancelled) return;

      setAcconts(downloadedAcconts);
      setAccontCache((prev) => ({
        ...prev,
        [typeOfAcconts]: downloadedAcconts,
      }));
    } catch (e: any) {
      if (!cancelled) setErr(e?.message ?? 'Failed to get acconts');
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    fetchAcconts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeOfAcconts]);

  const findScrollParent = (node: HTMLElement | null): HTMLElement | null => {
    let cur: HTMLElement | null = node?.parentElement ?? null;
    while (cur) {
      const style = window.getComputedStyle(cur);
      const y = style.overflowY;
      if ((y === 'auto' || y === 'scroll') && cur.scrollHeight > cur.clientHeight) {
        return cur;
      }
      cur = cur.parentElement;
    }
    return null;
  };

  useEffect(() => {
    if (!loadMoreRef.current) return;
    scrollRootRef.current = findScrollParent(loadMoreRef.current);
  });

  useEffect(() => {
    if (typeOfAcconts !== 'All Accounts') return;
    if (!loadMoreRef.current) return;

    const root = scrollRootRef.current ?? findScrollParent(loadMoreRef.current);
    scrollRootRef.current = root;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!hasNextPage || loading || loadingMore || isFetchingNextRef.current) return;
        isFetchingNextRef.current = true;
        fetchAllAccontsPage(page + 1);
      },
      {
        root,
        rootMargin: '300px 0px 300px 0px',
        threshold: 0,
      },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [typeOfAcconts, hasNextPage, loading, loadingMore, page]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const root = scrollRootRef.current;
      const isWindowScroll = !root;
      const viewport = isWindowScroll ? window.innerHeight : root.clientHeight;
      const smallStep = 80;
      const pageStep = Math.max(120, Math.floor(viewport * 0.85));

      let delta = 0;
      if (event.key === 'ArrowDown') delta = smallStep;
      else if (event.key === 'ArrowUp') delta = -smallStep;
      else if (event.key === 'PageDown') delta = pageStep;
      else if (event.key === 'PageUp') delta = -pageStep;
      else return;

      event.preventDefault();
      if (isWindowScroll) {
        window.scrollBy({ top: delta, behavior: 'smooth' });
      } else {
        root.scrollBy({ top: delta, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div>
      <div className="sticky top-0 z-20 bg-[#192134] w-full border-[#444] text-white flex flex-col items-center pb-1">
        <div className="flex items-center gap-3 text-[16px] mb-1 flex-wrap justify-center w-full">
          {activeAccountText && (
            <div className="inline-flex shrink-0 items-center justify-center gap-2">
              <span className="text-sm text-slate-300/80 whitespace-nowrap">
                Active Accounts:
              </span>
              <div className="shrink-0 max-w-none">
                <AssetSelectDisplayProvider>
                  <AssetSelectProvider
                    containerType={SP_COIN_DISPLAY.ACCOUNT_LIST_SELECT_PANEL}
                    closePanelCallback={() => {}}
                    setSelectedAssetCallback={() => {}}
                  >
                    <AddressSelect
                      callingParent="AccountsPage"
                      defaultAddress={activeAccountText}
                      bypassDefaultFsm
                      useActiveAddr
                      makeEditable={false}
                      showPreview={false}
                      fitToText
                    />
                  </AssetSelectProvider>
                </AssetSelectDisplayProvider>
              </div>
            </div>
          )}

          {showFilterControls &&
            accontOptions.map((option) => (
              <label key={option} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="accountFilter"
                  value={option}
                  checked={typeOfAcconts === option}
                  onChange={() => setTypeOfAcconts(option)}
                  className="mr-2"
                />
                <span className={typeOfAcconts === option ? 'text-green-400' : ''}>
                  {option}
                </span>
              </label>
            ))}
        </div>
      </div>

      <main>
        <div className="relative pr-2">
          {loading ? (
            <p className="text-center text-lg text-gray-400">Loading...</p>
          ) : err ? (
            <p className="text-center text-base text-red-400">Error: {err}</p>
          ) : (
            <>
              <ul className="list-none p-0 m-0">
                {acconts.map((accont: spCoinAccount, index) => (
                  <li
                    key={`${typeOfAcconts}-${accont.address}-${index}`}
                    className={`flex items-center p-3 mb-2 rounded ${
                      index % 2 === 0
                        ? 'bg-[#d6d6d6] text-[#000000]'
                        : 'bg-[#000000] text-[#d6d6d6]'
                    }`}
                  >
                    <img
                      src={getAccountLogo(accont) || defaultMissingImage}
                      alt="Logo"
                      width={100}
                      height={100}
                      className="rounded-full border-2 border-gray-300 mr-3"
                    />
                    <div className="text-inherit">
                      <div className="text-lg font-bold mb-2">
                        {accont.name || 'Unknown Accont'}
                      </div>
                      <pre className="whitespace-pre-wrap break-words ml-3 text-sm m-0 text-inherit">
                        {JSON.stringify(accont, null, 2)}
                      </pre>
                    </div>
                  </li>
                ))}
              </ul>
              {typeOfAcconts === 'All Accounts' && loadingMore && (
                <p className="text-center text-sm text-gray-400 py-3">Loading more accounts...</p>
              )}
              {typeOfAcconts === 'All Accounts' && !hasNextPage && acconts.length > 0 && (
                <p className="text-center text-xs text-gray-500 py-2">End of list</p>
              )}
              {typeOfAcconts === 'All Accounts' && <div ref={loadMoreRef} className="h-2 w-full" />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

type TestWalletsTabProps = {
  selectedFilter?: AccountFilter;
  onSelectedFilterChange?: (next: AccountFilter) => void;
};

export default function TestWalletsTab({
  selectedFilter,
  onSelectedFilterChange,
}: TestWalletsTabProps) {
  const { exchangeContext } = useExchangeContext();
  const activeAccount = exchangeContext?.accounts?.activeAccount as spCoinAccount | null | undefined;
  const activeAccountText = activeAccount?.address?.trim() || 'N/A';

  return (
    <div className="space-y-4">
      <div>
        <AccountsPage
          activeAccountText={activeAccountText}
          activeAccount={activeAccount ?? null}
          selectedFilter={selectedFilter}
          onSelectedFilterChange={onSelectedFilterChange}
          showFilterControls={false}
        />
      </div>
    </div>
  );
}
