'use client';

import React, { useEffect, useRef, useState } from 'react';
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
    if (!visible) {
      setVisible(true);
    }
  };

  return {
    visible,
    setVisible,
    portalRef,
    backgroundRef,
    toggleOnBackgroundClick,
  };
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
          {/* Image moved to top-left */}
          <div className="absolute top-0 left-0 p-[17px]">
            <Image src={spCoin_png} width={40} height={40} alt="Sponsor Coin Logo" />
          </div>

          <div className="flex justify-center mt-0">
            <div className="flex items-center gap-4 mb-6">
              <h1 className="text-3xl font-bold text-[#EBCA6A]">SponsorCoin Portal</h1>
            </div>
          </div>

          <section className="bg-[#1A1D2E] p-4 rounded-2xl shadow-md">
            <p className="text-lg mb-4 text-white text-center">
              Welcome to the SponsorCoin configuration page. Here you can trade tokens, support your causes, create sposorship relationships, earn rewards, and much more.
            </p>

            <div className="space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/Exchange" className={cardStyle}>
                  <h2 className={headerStyle}>SponsorCoin Exchange</h2>
                  <p className={paragraphStyle}>
                    Trade on Sponsorcoin Exchange and be eligible for future SponsorCoin drops.
                  </p>
                </Link>
                <Link href="/ManageAccounts" className={cardStyle}>
                  <h2 className={headerStyle}>Manage Your SponsorCoin Accounts</h2>
                  <p className={paragraphStyle}>
                    Wether you are a sponsor, agent or recipient, you can view or edit the SponsorCoin accounts and Balances, including managing sponsorship relationships and
                    claiming Rewards.
                  </p>
                </Link>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/SponsorMe" className={cardStyle}>
                  <h2 className={headerStyle}>Create a "Sponsor Me" Account</h2>
                  <p className={paragraphStyle}>
                    Set up a sponsorCoin recipient account to recieve crypto credit rewards through your sponsorCoin relationships
                  </p>
                </Link>

                <Link href="/CreateAgent" className={cardStyle}>
                  <h2 className={headerStyle}>Create an Agent Account</h2>
                  <p className={paragraphStyle}>
                    As an agent, you can create an agent account to manage sponsorships and receive rewards.
                  </p>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/SpCoinAPI" className={cardStyle}>
                  <h2 className={headerStyle}>SpCoin API for Developers</h2>
                  <p className={paragraphStyle}>
                    Connect to the blockCoin token utilizing SponsorCoin's API's for advanced development. SponsorCoin Exchange was built utilizing these API's
                  </p>
                </Link>

                <Link href="/WhitePaper" className={cardStyle}>
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
