// File: @/app/(menu)/(dynamic)/RecipientSite/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useExchangeContext } from '@/lib/context/hooks';
import { useActiveAccount } from '@/lib/context/ActiveAccountContext';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const TAB_STORAGE_KEY = 'header_open_tabs';
const RECIPIENT_TAB_HREF = '/RecipientSite';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_RECIPIENT_SITE === 'true' || true;
const dbg = (...args: any[]) => {
  if (DEBUG_ENABLED) console.debug('[RecipientSite]', ...args);
};

function ensureHeaderTab() {
  try {
    const raw = sessionStorage.getItem(TAB_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(arr)
      ? Array.from(new Set([...arr, RECIPIENT_TAB_HREF]))
      : [RECIPIENT_TAB_HREF];
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // no-op (private mode, etc.)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('header:add-tab', { detail: { href: RECIPIENT_TAB_HREF } })
    );
  }
}

function normalizeUrl(u?: string | null): string | undefined {
  const s = (u ?? '').trim();
  if (!s) return undefined;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `https://${s}`;
}

export default function Recipient() {
  const searchParams = useSearchParams();
  const queryUrlParam = searchParams.get('url');

  const { exchangeContext } = useExchangeContext();
  const activeAccount = useActiveAccount();

  const selectedRecipient = exchangeContext?.accounts?.recipientAccount;
  const recipientWebsite = selectedRecipient?.website;
  const connectedWebsite = activeAccount?.website;

  // 🔎 Extra debug so we can verify the wallet JSON fields are present (incl. `website`)
  useEffect(() => {
    if (!DEBUG_ENABLED) return;
    dbg('query url =', queryUrlParam);
    dbg('selectedRecipient =', stringifyBigInt(selectedRecipient));
    dbg('activeAccount =', stringifyBigInt(activeAccount));
    dbg('selectedRecipient.website =', selectedRecipient?.website);
    dbg('activeAccount.website =', activeAccount?.website);
  }, [queryUrlParam, selectedRecipient, activeAccount]);

  // Pick the best source for the URL (priority: query param → selected recipient → connected account)
  const chosenUrl = useMemo(() => {
    const fromQuery = normalizeUrl(queryUrlParam);
    if (fromQuery) {
      dbg('Using query url:', fromQuery);
      return fromQuery;
    }
    const fromRecipient = normalizeUrl(recipientWebsite);
    if (fromRecipient) {
      dbg('Using recipient website:', fromRecipient, 'for', selectedRecipient?.address);
      return fromRecipient;
    }
    const fromConnected = normalizeUrl(connectedWebsite);
    if (fromConnected) {
      dbg('Using connected account website:', fromConnected, 'for', activeAccount?.address);
      return fromConnected;
    }
    dbg('Falling back to default help page');
    return undefined;
  }, [
    queryUrlParam,
    recipientWebsite,
    connectedWebsite,
    selectedRecipient?.address,
    activeAccount?.address,
  ]);

  useEffect(() => {
    ensureHeaderTab();
  }, []);

  const defaultHelpPage =
    typeof window !== 'undefined'
      ? `${window.location.origin}/websites/spcoin/page/recipient-page-doc.html`
      : '';

  const [remoteUrl, setRemoteUrl] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('iframeUrl') || defaultHelpPage;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<boolean>(false);

  const parentContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // If a chosen URL exists (query or website fields), use it; otherwise use the help page.
    const next = chosenUrl ?? (defaultHelpPage ? `${defaultHelpPage}?timestamp=${Date.now()}` : '');
    if (!next) return;

    setRemoteUrl(next);
    try {
      // persist a clean help page without timestamp for later refreshes
      sessionStorage.setItem('iframeUrl', chosenUrl ?? defaultHelpPage);
    } catch {
      // ignore storage failures
    }
    setLoading(true);
    setLoadingError(false);

    if (DEBUG_ENABLED) dbg('remoteUrl set →', next);
  }, [chosenUrl, defaultHelpPage]);

  const handleIframeError = () => setLoadingError(true);
  const handleIframeLoad = () => setLoading(false);

  return (
    <div>
      <div ref={parentContainerRef} className="relative">
        {loadingError ? (
          <p className="text-red-600">
            Failed to load the content. The website may not allow embedding.
          </p>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 p-4 text-xl font-bold text-gray-800">
                <h1 className="mb-4 text-xl font-bold">Remote URL Loader</h1>
                <p>
                  Now loading: <strong>{remoteUrl}</strong>
                </p>
              </div>
            )}
            <iframe
              src={remoteUrl}
              className="h-[calc(100vh-60px)] w-full border-0"
              title="Remote Content"
              onError={handleIframeError}
              onLoad={handleIframeLoad}
            />
          </>
        )}
      </div>
    </div>
  );
}
