// File: app/(menu)/(dynamic)/RecipientSite/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Recipient() {
  const searchParams = useSearchParams();
  const urlParam = searchParams.get('url');

  // Default help page URL
  const defaultHelpPage =
    typeof window !== 'undefined'
      ? `${window.location.origin}/websites/spcoin/page/recipient-page-doc.html`
      : '';

  // State management for the iframe
  const [remoteUrl, setRemoteUrl] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('iframeUrl') || defaultHelpPage;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<boolean>(false);

  // Reference for parent container
  const parentContainerRef = useRef<HTMLDivElement | null>(null);

  // Handle URL updates and persist state
  useEffect(() => {
    if (!urlParam && typeof window === 'undefined') return;

    if (urlParam) {
      // Ensure URL starts with https:// or http://
      const formattedUrl =
        urlParam.startsWith('https://') || urlParam.startsWith('http://')
          ? urlParam
          : `https://${urlParam}`;

      setRemoteUrl(formattedUrl);
      sessionStorage.setItem('iframeUrl', formattedUrl);
      setLoading(true);
      setLoadingError(false);
    } else if (!sessionStorage.getItem('iframeUrl')) {
      // If no previous state, reload the default help page
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
      {/* Iframe Container */}
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
