"use client";

import { useEffect, useState, useRef } from "react";
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
  
  // Store iframe height state
  const [iframeHeight, setIframeHeight] = useState<number>(window.innerHeight);

  // Reference to the parent container
  const parentContainerRef = useRef<HTMLDivElement | null>(null);

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
  }, []); // Dependency on `url` ensures this runs every time it changes

  // Dynamically set iframe height based on window height minus 99px
  useEffect(() => {
    const updateIframeHeight = () => {
      setIframeHeight(window.innerHeight - 60);
    };

    window.addEventListener("resize", updateIframeHeight);

    // Call it initially to set the height when the component mounts
    updateIframeHeight();

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("resize", updateIframeHeight);
    };
  }, []);

  const handleIframeError = () => {
    setLoadingError(true);
  };

  const handleIframeLoad = () => {
    setLoading(false); // Set loading to false once the iframe has loaded
  };

  return (
    <div>
      {/* Iframe Container */}
      <div
        ref={parentContainerRef} // Add ref to the parent container
        className=""
      >
        {loadingError ? (
          <p className="text-red-600">Failed to load the content. The website may not allow embedding.</p>
        ) : (
          <>
            {/* Show loading placeholder with Remote URL loader text */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 text-xl text-gray-800 font-bold p-4">
                <h1 className="text-xl font-bold mb-4">Remote URL Loader</h1>
                <p>Now loading: <strong>{remoteUrl}</strong></p>
              </div>
            )}

            <iframe
              key={remoteUrl} // Forces re-render when URL changes
              src={remoteUrl}
              className="w-full"
              style={{ height: `${iframeHeight}px` }} // Dynamically set height
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
