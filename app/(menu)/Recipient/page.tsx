"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function Recipient() {
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("url");

  // Default help page URL
  const defaultHelpPage =
    typeof window !== "undefined"
      ? `${window.location.origin}/websites/spcoin/page/recipient-page-doc.html`
      : "";

  // State management for the iframe
  const [remoteUrl, setRemoteUrl] = useState<string>(
    () => sessionStorage.getItem("iframeUrl") || defaultHelpPage
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<boolean>(false);
  const [iframeHeight, setIframeHeight] = useState<number>(typeof window !== "undefined" ? window.innerHeight - 60 : 600);

  // Reference for parent container
  const parentContainerRef = useRef<HTMLDivElement | null>(null);

  // Handle URL updates and persist state
  useEffect(() => {
    if (urlParam) {
      // Ensure URL starts with https:// or http://
      const formattedUrl =
        urlParam.startsWith("https://") || urlParam.startsWith("http://")
          ? urlParam
          : `https://${urlParam}`;

      // Update state and persist in sessionStorage
      setRemoteUrl(formattedUrl);
      sessionStorage.setItem("iframeUrl", formattedUrl);
    } else if (!sessionStorage.getItem("iframeUrl")) {
      // If no previous state, reload the default help page
      setRemoteUrl(`${defaultHelpPage}?timestamp=${Date.now()}`);
      sessionStorage.setItem("iframeUrl", defaultHelpPage);
    }
  }, [urlParam]); // Dependency ensures it runs when `urlParam` changes

  // Update iframe height dynamically
  useEffect(() => {
    const updateIframeHeight = () => setIframeHeight(window.innerHeight - 60);

    window.addEventListener("resize", updateIframeHeight);
    updateIframeHeight();

    return () => window.removeEventListener("resize", updateIframeHeight);
  }, []);

  const handleIframeError = () => setLoadingError(true);
  const handleIframeLoad = () => setLoading(false);

  return (
    <div>
      {/* Iframe Container */}
      <div ref={parentContainerRef} className="">
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
              className="w-full"
              style={{ height: `${iframeHeight}px` }}
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
