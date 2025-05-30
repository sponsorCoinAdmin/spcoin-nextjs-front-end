'use client';

import React from 'react';

const h2Class = 'mt-4 text-[20px] font-bold';

export default function WhitePaper() {
  return (
    <main className="prose max-w-none p-8 bg-white min-h-screen" style={{ color: '#000' }}>
      <h1 className="text-center text-[30px] font-bold mb-10">
        Swap For Sick Kids Hospital SponsorCoins Here
      </h1>

      {/* Flex container for side-by-side layout */}
      <div className="flex flex-col lg:flex-row gap-10 items-start justify-center">
        {/* Left: Image + Label */}
        <div className="flex flex-col items-center max-w-full lg:max-w-[600px]">
          <img
            src="/docs/SpCoinAPI_files/image001.png"
            alt="Recipient Page"
            className="w-full max-w-[600px] h-auto mb-4"
          />
          <h2 className={h2Class}>Image 1 (Recipient Page)</h2>
        </div>

        {/* Right: Abstract */}
        <div className="text-base leading-7 lg:max-w-[600px] px-4">
          <p>
            <b>Abstract:</b> A purely peer-to-peer version of sponsorship crypto would allow online
            payments to be sent directly from one party to another without going through a financial
            institution. Financial Institutions while claiming to be secure are one of the least
            secure parties due partially to “Bail in Legal Tender Laws” and total disregard for
            privacy utilizing KYC, “Know Your Client” and other protocol tracking implementations.
            We propose a solution where the free-market economy can donate sponsorCoin crypto coins
            while maintaining complete custody of any sponsorCoins obtained. This donation is an
            ongoing sponsorship implementation utilizing proof of stake and is only revoked when the
            coins are either unsponsored to be removed from the sponsor’s wallet and returned to the
            market, or the sponsor reallocates the coins to a new sponsor...
          </p>
        </div>
      </div>
    </main>
  );
}
