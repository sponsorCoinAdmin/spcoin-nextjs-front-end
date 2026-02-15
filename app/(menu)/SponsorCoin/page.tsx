// File: app/(menu)/SponsorCoin/page.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  const {
    visible: showSpCoinPortal,
    portalRef,
    backgroundRef,
    toggleOnBackgroundClick,
  } = useTogglePortal<HTMLDivElement>();

  const cardStyle =
    'group p-4 rounded-xl bg-[#0E111B] hover:bg-[rgb(79,86,101)] cursor-pointer transition-colors duration-200';
  const headerStyle =
    'text-xl font-semibold mb-2 text-center text-[#5981F3] group-hover:text-[#000000] transition-colors';
  const paragraphStyle =
    'text-sm text-white group-hover:text-[#FFFFFF] transition-colors text-left';

  // Helper to attach to Link onClick for dynamic tabs
  const onOpenTab = useCallback((href: string) => {
    openHeaderTab(href);
  }, []);

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
                <Link href="/Exchange" className={cardStyle}>
                  <h2 className={headerStyle}>SponsorCoin Exchange</h2>
                  <p className={paragraphStyle}>
                    Trade on SponsorCoin Exchange and be eligible for future SponsorCoin drops.
                  </p>
                </Link>

                {/* Dynamic tab: Manage Accounts */}
                <Link
                  href="/ManageAccounts"
                  className={cardStyle}
                  onClick={() => onOpenTab('/ManageAccounts')}
                >
                  <h2 className={headerStyle}>Manage Your SponsorCoin Accounts</h2>
                  <p className={paragraphStyle}>
                    Whether you are a sponsor, agent, or recipient, you can view or edit SponsorCoin accounts
                    and balances, manage sponsorship relationships, and claim rewards.
                  </p>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dynamic tab: Sponsor Me */}
                <Link
                  href="/SponsorMe"
                  className={cardStyle}
                  onClick={() => onOpenTab('/SponsorMe')}
                >
                  <h2 className={headerStyle}>Create a "Sponsor Me" Account</h2>
                  <p className={paragraphStyle}>
                    Set up a SponsorCoin recipient account to receive crypto credit rewards through your
                    SponsorCoin relationships.
                  </p>
                </Link>

                {/* Dynamic tab: Create Agent */}
                <Link
                  href="/CreateAgent"
                  className={cardStyle}
                  onClick={() => onOpenTab('/CreateAgent')}
                >
                  <h2 className={headerStyle}>Create an Agent Account</h2>
                  <p className={paragraphStyle}>
                    As an agent, you can create an account to manage sponsorships and receive rewards.
                  </p>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dynamic tab: SpCoin API */}
                <Link
                  href="/SpCoinAPI"
                  className={cardStyle}
                  onClick={() => onOpenTab('/SpCoinAPI')}
                >
                  <h2 className={headerStyle}>SpCoin API for Developers</h2>
                  <p className={paragraphStyle}>
                    Connect to the BlockCoin token using SponsorCoin’s APIs for advanced development. The
                    SponsorCoin Exchange was built using these APIs.
                  </p>
                </Link>

                {/* Dynamic tab: White Paper */}
                <Link
                  href="/WhitePaper"
                  className={cardStyle}
                  onClick={() => onOpenTab('/WhitePaper')}
                >
                  <h2 className={headerStyle}>SponsorCoin White Paper</h2>
                  <p className={paragraphStyle}>
                    Read the SponsorCoin white paper and learn more about the project.
                  </p>
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
