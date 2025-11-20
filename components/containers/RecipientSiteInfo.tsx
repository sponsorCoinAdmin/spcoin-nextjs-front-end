// File: components/containers/RecipientSiteInfo.tsx
// Author: Robin (robin@spcoin.com)
// Date: 2023-09-19
// Description: Recipient Site Info
// License: MIT
// Copyright (c) 2023 Robin (robin@spcoin.com)

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const DEBUG_RECIPIENT_SITE =
  process.env.NEXT_PUBLIC_DEBUG_RECIPIENT_META === "true";

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

    if (DEBUG_RECIPIENT_SITE) {
      // Log the raw query param exactly as received
      console.debug("[RecipientSiteInfo] raw ?url param:", url);
    }

    if (url) {
      const trimmed = url.trim();

      // Ensure the URL starts with an explicit scheme
      const formattedUrl =
        trimmed.startsWith("https://") || trimmed.startsWith("http://")
          ? trimmed
          : `https://${trimmed}`;

      if (DEBUG_RECIPIENT_SITE) {
        console.debug("[RecipientSiteInfo] formatted remoteUrl:", formattedUrl);

        if (
          formattedUrl.includes("/assets/accounts/") &&
          formattedUrl.includes("site-info.html")
        ) {
          console.debug(
            "[RecipientSiteInfo] Using internal site-info.html fallback URL (check case of siteKey / account dir)",
          );
        } else {
          console.debug(
            "[RecipientSiteInfo] Using external website URL (wallet.website)",
          );
        }
      }

      setRemoteUrl(formattedUrl);
    } else if (typeof window !== "undefined") {
      const helpUrl = `${window.location.origin}/websites/spcoin/page/recipient-page-doc.html?timestamp=${Date.now()}`;

      if (DEBUG_RECIPIENT_SITE) {
        console.debug(
          "[RecipientSiteInfo] No ?url param, using help page:",
          helpUrl,
        );
      }

      setRemoteUrl(helpUrl);
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
          <p className="text-red-600">
            Failed to load the content. The website may not allow embedding.
          </p>
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

                {DEBUG_RECIPIENT_SITE && (
                  <div className="mt-4 text-xs text-gray-700 break-all">
                    <div>
                      <strong>Debug raw ?url:</strong> {url ?? "<null>"}
                    </div>
                    <div>
                      <strong>Debug remoteUrl:</strong> {remoteUrl}
                    </div>
                  </div>
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
