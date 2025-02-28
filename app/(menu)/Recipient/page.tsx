"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Recipient() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  // Default help page URL (ensures correct domain)
  const defaultHelpPage =
    typeof window !== "undefined"
      ? `${window.location.origin}/websites/spcoin/page/recipient-page-doc.html`
      : "";

  // Track loading state for the iframe
  const [loadingError, setLoadingError] = useState(false);
  const [loading, setLoading] = useState(true); // Track loading state for the iframe
  const [remoteUrl, setRemoteUrl] = useState<string>(defaultHelpPage);

  useEffect(() => {
    setLoading(true); // Reset loading state
    setLoadingError(false); // Reset error state

    if (url) {
      // Ensure the URL starts with "https://"
      const formattedUrl =
        url.startsWith("https://") || url.startsWith("http://")
          ? url
          : `https://${url}`;
      setRemoteUrl(formattedUrl);
    } else {
      // Reload the default help page when no URL is provided
      setRemoteUrl(`${window.location.origin}/websites/spcoin/page/recipient-page-doc.html?timestamp=${Date.now()}`);
    }
  }, [url]); // Dependency on `url` ensures this runs every time it changes

  const handleIframeError = () => {
    setLoadingError(true);
  };

  const handleIframeLoad = () => {
    setLoading(false); // Set loading to false once the iframe has loaded
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-5">
      <h1 className="text-xl font-bold mb-4">Remote URL Loader</h1>

      {url ? (
        <p className="text-gray-600 mb-4">
          Now loading: <strong>{remoteUrl}</strong>
        </p>
      ) : (
        <p className="text-gray-600 mb-4">No URL provided. Loading help page...</p>
      )}

      {/* Iframe Container */}
      <div className="w-full h-[500px] border rounded-lg shadow-lg overflow-hidden relative">
        {loadingError ? (
          <p className="text-red-600">Failed to load the content. The website may not allow embedding.</p>
        ) : (
          <>
            {/* Show loading placeholder while the iframe is loading */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-xl text-white">
                Loading...
              </div>
            )}

            <iframe
              key={remoteUrl} // Forces re-render when URL changes
              src={remoteUrl}
              className="w-full h-full"
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
