// File: app/(menu)/SponsorCoin/page.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';

function useTogglePortal<T extends HTMLElement>() {
  const [visible, setVisible] = useState(true);
  const portalRef = useRef<T>(null);
  const backgroundRef = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        portalRef.current &&
        !portalRef.current.contains(event.target as Node) &&
        backgroundRef.current?.contains(event.target as Node)
      ) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOnBackgroundClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!visible) setVisible(true);
  };

  return { visible, setVisible, portalRef, backgroundRef, toggleOnBackgroundClick };
}

/** Tell the header to open/persist a tab for a given route */
function openHeaderTab(href: string) {
  try {
    const key = 'header_open_tabs';
    const raw = sessionStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(arr) ? Array.from(new Set([...arr, href])) : [href];
    sessionStorage.setItem(key, JSON.stringify(next));
  } catch {
    // sessionStorage might be unavailable (e.g., private mode, SSR hiccup)
    void 0;
  }
  // Notify Header immediately (works even before navigation completes)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('header:add-tab', { detail: { href } }));
  }
}

export default function SponsorCoinPage() {
  const router = useRouter();
  const {
    visible: showSpCoinPortal,
    portalRef,
    backgroundRef,
    toggleOnBackgroundClick,
  } = useTogglePortal<HTMLDivElement>();

  const cardBaseStyle =
    'group flex h-full flex-col p-4 rounded-xl bg-[#0E111B] transition-colors duration-200';
  const cardHoverStyle = 'hover:bg-[#5981F3]/35';
  const headerStyle =
    'text-xl font-semibold mb-2 text-center text-[#5981F3] group-hover:text-[#000000] transition-colors';
  const paragraphStyle =
    'text-sm text-white group-hover:text-[#FFFFFF] transition-colors text-left';

  // Helper to attach to Link onClick for dynamic tabs
  const onOpenTab = useCallback((href: string) => {
    openHeaderTab(href);
  }, []);

  const openCardPath = useCallback(
    (href: string) => {
      onOpenTab(href);
      router.push(href);
    },
    [onOpenTab, router],
  );

  const handleOpenCreateAccount = useCallback(() => {
    openCardPath('/createAccount');
  }, [openCardPath]);

  return (
    <main
      ref={backgroundRef}
      className="min-h-screen p-6 bg-cover bg-center relative"
      style={{
        backgroundImage: showSpCoinPortal
          ? 'none'
          : "url('/assets/backgrounds/sponsorcoin-causes.png')",
        cursor: showSpCoinPortal ? 'default' : 'pointer',
      }}
      onClick={toggleOnBackgroundClick}
    >
      {showSpCoinPortal && (
        <div
          ref={portalRef}
          id="sponsorCoinPortal"
          className="relative backdrop-blur-sm bg-[#0E111B]/80 rounded-2xl p-6 max-w-5xl mx-auto"
        >
          {/* Logo top-left */}
          <div className="absolute top-0 left-0 p-[17px]">
            <Image src={spCoin_png} width={40} height={40} alt="SponsorCoin Logo" />
          </div>

          <div className="flex justify-center mt-0">
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-3xl font-bold text-[#EBCA6A]">SponsorCoin Portal</h1>
            </div>
          </div>

          <section className="bg-[#1A1D2E] p-4 rounded-2xl shadow-md">
            <p className="text-lg mb-4 text-white text-center">
              Welcome to the SponsorCoin configuration page. Here you can trade tokens, support your causes,
              create sponsorship relationships, earn rewards, and much more.
            </p>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Exchange is primary nav, not a dynamic tab */}
                <div
                  className={`${cardBaseStyle} ${cardHoverStyle} cursor-pointer`}
                  onClick={() => openCardPath('/Exchange')}
                >
                  <h2 className={headerStyle}>SponsorCoin Exchange</h2>
                  <p className={paragraphStyle}>
                    Trade on SponsorCoin Exchange and be eligible for future SponsorCoin drops.
                  </p>
                </div>

                {/* Dynamic tab: Create account */}
                <div
                  className={`${cardBaseStyle} ${cardHoverStyle} cursor-pointer`}
                  onClick={handleOpenCreateAccount}
                >
                  <h2 className={headerStyle}>Create a Sponsor Coin Account.</h2>
                  <p className={paragraphStyle}>
                    Set up a SponsorCoin account which can be used as a Sponsor, Recipient, or Agent Account. You need a Metamask account to create a SponsorCoin account.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dynamic tab: SpCoin API */}
                <div
                  className={`${cardBaseStyle} ${cardHoverStyle} cursor-pointer`}
                  onClick={() => openCardPath('/SpCoinAPI')}
                >
                  <h2 className={headerStyle}>SpCoin API for Developers</h2>
                  <p className={paragraphStyle}>
                    Connect to the BlockCoin token using SponsorCoin’s APIs for advanced development. The
                    SponsorCoin Exchange was built using these APIs.
                  </p>
                </div>

                {/* Dynamic tab: White Paper */}
                <div
                  className={`${cardBaseStyle} ${cardHoverStyle} cursor-pointer`}
                  onClick={() => openCardPath('/WhitePaper')}
                >
                  <h2 className={headerStyle}>SponsorCoin White Paper</h2>
                  <p className={paragraphStyle}>
                    Read the SponsorCoin white paper and learn more about the project.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
