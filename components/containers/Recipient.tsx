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
  const [loading, setLoading] = useState(true);
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
  }, [url]);

  const handleIframeError = () => {
    setLoadingError(true);
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-gray-100 p-5">
      {/* Iframe Container */}
      <div className="w-full h-full relative">
        {loadingError ? (
          <p className="text-red-600">Failed to load the content. The website may not allow embedding.</p>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 text-xl text-gray-800 font-bold p-4">
                <p>Remote URL Loader</p>
                {url ? (
                  <>
                    Now loading: <strong>{remoteUrl}</strong>
                  </>
                ) : (
                  <>No URL provided. Loading help page...</>
                )}
              </div>
            )}

            <iframe
              key={remoteUrl}
              src={remoteUrl}
              className="w-full h-full" // Full width and height
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
