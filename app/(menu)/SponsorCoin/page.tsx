'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';

// Inline hook (scoped to this page)
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

  return (
    <main
      ref={backgroundRef}
      className="min-h-screen text-white p-6 bg-cover bg-center relative"
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
          className="backdrop-blur-sm bg-[#0E111B]/80 rounded-2xl p-6 max-w-4xl mx-auto"
        >
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-4 mb-8">
              <Image src={spCoin_png} width={48} height={48} alt="Sponsor Coin Logo" />
              <h1 className="text-3xl font-bold text-[#5981F3]">SponsorCoin Portal</h1>
            </div>
          </div>

          <section className="bg-[#1A1D2E] p-6 rounded-2xl shadow-md">
            <p className="text-lg mb-4">
              Welcome to the SponsorCoin configuration page. Here you can configure sponsor-related token settings, update metadata, and preview sponsorship options.
            </p>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className="p-4 rounded-xl hover:bg-[rgb(119,126,142)] cursor-pointer transition-colors duration-200"
                  onClick={() => alert('Type ToDo: Configure Sponsorship')}
                >
                  <h2 className="text-xl font-semibold mb-2">Configure Sponsorship</h2>
                  <p className="text-sm text-gray-300">
                    Set sponsorship rates, designate recipients, and review sponsor history.
                  </p>
                </div>

                <div
                  className="p-4 rounded-xl hover:bg-[rgb(119,126,142)] cursor-pointer transition-colors duration-200"
                  onClick={() => alert('Type ToDo: Token Info')}
                >
                  <h2 className="text-xl font-semibold mb-2">Token Info</h2>
                  <p className="text-sm text-gray-300">
                    View or edit the SponsorCoin token metadata including name, symbol, and decimals.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className="p-4 rounded-xl hover:bg-[rgb(119,126,142)] cursor-pointer transition-colors duration-200"
                  onClick={() => alert('Type ToDo: Create a Sponsor Me Account')}
                >
                  <h2 className="text-xl font-semibold mb-2">Create a Sponsor Me Account</h2>
                  <p className="text-sm text-gray-300">
                    Set up a sponsorship recipient account and set up a sponsorship profile.
                  </p>
                </div>

                <div
                  className="p-4 rounded-xl hover:bg-[rgb(119,126,142)] cursor-pointer transition-colors duration-200"
                  onClick={() => alert('Type ToDo: Token Info')}
                >
                  <h2 className="text-xl font-semibold mb-2">Token Info</h2>
                  <p className="text-sm text-gray-300">
                    View or edit the SponsorCoin token metadata including name, symbol, and decimals.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className="p-4 rounded-xl hover:bg-[rgb(119,126,142)] cursor-pointer transition-colors duration-200"
                  onClick={() => alert('Type ToDo: SponsorCoin Exchange')}
                >
                  <h2 className="text-xl font-semibold mb-2">SponsorCoin Exchange</h2>
                  <p className="text-sm text-gray-300">
                    Trade on Sponsorcoin Exchange and be eligible for future SponsorCoin drops.
                  </p>
                </div>

                <div
                  className="p-4 rounded-xl hover:bg-[rgb(119,126,142)] cursor-pointer transition-colors duration-200"
                  onClick={() => alert('Type ToDo: SponsorCoin White Paper')}
                >
                  <h2 className="text-xl font-semibold mb-2">SponsorCoin White Paper</h2>
                  <p className="text-sm text-gray-300">
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
