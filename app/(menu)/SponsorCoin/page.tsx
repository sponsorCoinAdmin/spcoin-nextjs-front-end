// File: app/(menu)/SponsorCoin/page.tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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

function openHeaderTab(href: string) {
  try {
    const key = 'header_open_tabs';
    const raw = sessionStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(arr) ? Array.from(new Set([...arr, href])) : [href];
    sessionStorage.setItem(key, JSON.stringify(next));
  } catch {
    void 0;
  }

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
    'group flex h-full flex-col rounded-xl bg-[#0E111B] p-4 transition-colors duration-200';
  const cardHoverStyle = 'hover:bg-[#5981F3]/35';
  const headerStyle =
    'mb-2 text-center text-xl font-semibold text-[#5981F3] transition-colors group-hover:text-[#000000]';
  const paragraphStyle =
    'text-left text-sm text-white transition-colors group-hover:text-[#FFFFFF]';

  const onOpenTab = useCallback((href: string) => {
    openHeaderTab(href);
  }, []);

  const openCardPath = useCallback(
    (href: string, options?: { addTab?: boolean; focusExistingHeaderLink?: boolean }) => {
      if (options?.focusExistingHeaderLink && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('header:focus-link', { detail: { href } }));
      }
      if (options?.addTab !== false) {
        onOpenTab(href);
      }
      router.push(href);
    },
    [onOpenTab, router],
  );

  const handleOpenCreateAccount = useCallback(() => {
    openCardPath('/EditAccount');
  }, [openCardPath]);

  return (
    <main
      ref={backgroundRef}
      className="relative min-h-screen bg-cover bg-center p-6"
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
          className="relative mx-auto max-w-5xl rounded-2xl bg-[#0E111B]/80 p-6 backdrop-blur-sm"
        >
          <div className="absolute left-0 top-0 p-[17px]">
            <Image src={spCoin_png} width={40} height={40} alt="SponsorCoin Logo" />
          </div>

          <div className="mt-0 flex justify-center">
            <div className="mb-6 flex items-center gap-4">
              <h1 className="text-3xl font-bold text-[#EBCA6A]">SponsorCoin Portal</h1>
            </div>
          </div>

          <section className="rounded-2xl bg-[#1A1D2E] p-4 shadow-md">
            <p className="mb-4 text-center text-lg text-white">
              Welcome to the SponsorCoin configuration page. Here you can trade tokens, support your causes,
              create sponsorship relationships, earn rewards, and much more.
            </p>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-3">
              <div
                className={`${cardBaseStyle} ${cardHoverStyle} cursor-pointer md:col-start-1 md:row-start-1`}
                onClick={() =>
                  openCardPath('/Exchange', {
                    addTab: false,
                    focusExistingHeaderLink: true,
                  })
                }
              >
                <h2 className={headerStyle}>SponsorCoin Exchange</h2>
                <p className={paragraphStyle}>
                  Trade on SponsorCoin Exchange and be eligible for future SponsorCoin drops.
                </p>
              </div>

              <div
                className={`${cardBaseStyle} ${cardHoverStyle} cursor-pointer md:col-start-2 md:row-start-1`}
                onClick={handleOpenCreateAccount}
              >
                <h2 className={headerStyle}>Create or Edit Sponsor Coin Accounts</h2>
                <p className={paragraphStyle}>
                  Set up a SponsorCoin account which can be used as a Sponsor, Recipient, or Agent Account. You need a
                  Metamask account to create a SponsorCoin account.
                </p>
              </div>

              <div
                className={`${cardBaseStyle} ${cardHoverStyle} cursor-pointer md:col-start-1 md:row-start-2`}
                onClick={() => openCardPath('/SpCoinAPI')}
              >
                <h2 className={headerStyle}>SpCoin API for Developers</h2>
                <p className={paragraphStyle}>
                  Connect to the BlockCoin token using SponsorCoin's APIs for advanced development. The SponsorCoin
                  Exchange was built using these APIs.
                </p>
              </div>

              <div
                className={`${cardBaseStyle} ${cardHoverStyle} cursor-pointer md:col-start-1 md:row-start-3`}
                onClick={() => openCardPath('/SpCoinAccessManager')}
              >
                <h2 className={headerStyle}>SpCoin Access Manager</h2>
                <p className={paragraphStyle}>
                  Manage the local SponsorCoin npm source workspace, package versions, and upload or download flows.
                </p>
              </div>

              <div
                className={`${cardBaseStyle} ${cardHoverStyle} cursor-pointer md:col-start-2 md:row-start-2`}
                onClick={() => openCardPath('/WhitePaper')}
              >
                <h2 className={headerStyle}>SponsorCoin White Paper</h2>
                <p className={paragraphStyle}>
                  Read the SponsorCoin white paper and learn more about the project.
                </p>
              </div>

            </div>
          </section>
        </div>
      )}
    </main>
  );
}
