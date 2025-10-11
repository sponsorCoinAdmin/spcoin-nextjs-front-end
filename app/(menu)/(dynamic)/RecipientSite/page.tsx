// File: app/(menu)/(dynamic)/RecipientSite/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const TAB_STORAGE_KEY = 'header_open_tabs';
const RECIPIENT_TAB_HREF = '/RecipientSite';

// ✅ Ensure the header shows the tab even on direct navigation / page refresh
function ensureHeaderTab() {
  try {
    const raw = sessionStorage.getItem(TAB_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(arr) ? Array.from(new Set([...arr, RECIPIENT_TAB_HREF])) : [RECIPIENT_TAB_HREF];
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(next));
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('header:add-tab', { detail: { href: RECIPIENT_TAB_HREF } }));
  }
}

export default function Recipient() {
  const searchParams = useSearchParams();
  const urlParam = searchParams.get('url');

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
    if (!urlParam && typeof window === 'undefined') return;

    if (urlParam) {
      const formattedUrl =
        urlParam.startsWith('https://') || urlParam.startsWith('http://')
          ? urlParam
          : `https://${urlParam}`;

      setRemoteUrl(formattedUrl);
      sessionStorage.setItem('iframeUrl', formattedUrl);
      setLoading(true);
      setLoadingError(false);
    } else if (!sessionStorage.getItem('iframeUrl')) {
      const withTs = `${defaultHelpPage}?timestamp=${Date.now()}`;
      setRemoteUrl(withTs);
      sessionStorage.setItem('iframeUrl', defaultHelpPage);
      setLoading(true);
      setLoadingError(false);
    }
  }, [urlParam, defaultHelpPage]);

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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 text-xl text-gray-800 font-bold p-4">
                <h1 className="text-xl font-bold mb-4">Remote URL Loader</h1>
                <p>
                  Now loading: <strong>{remoteUrl}</strong>
                </p>
              </div>
            )}
            <iframe
              src={remoteUrl}
              className="w-full h-[calc(100vh-60px)] border-0"
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
