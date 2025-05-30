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
            <b>SPONSOR COIN:</b>The SponsorCoin protocol propose a solution where the free-market economy can donate sponsorCoin crypto coins to there cause with no cost of any kind from the sponsor’s portfolio. The sponsorCoin owner maintains complete custody of any sponsorCoins obtained. The owner of the coin may generate staking rewards by identifying a sponsored beneficiary as a worthwhile cause and assigning the beneficiary’s Ethereum address to share in the staking rewards. The coin owner/sponsor never relinquishes any of his sponsorCoin investment but instead simply shares the proof of stake rewards with their chosen charity. This donation is an ongoing sponsorship implementation ,utilizing proof of stake and is only revoked when the coins are either unsponsored to be removed from the sponsor’s wallet and returned to the market, or the sponsor reallocates the coins to a new sponsor.  Newly allocated proof of stake coins will have a portion of these coins distributed to the sponsored recipient’s wallet with the remaining coins deposited in the sponsor’s wallet.  The recipient’s coins may further have a portion of the reward distributed to an agent responsible for establishing the sponsorship relationship. The proof of stake coin rewards allocated back to the parties involved shall have no allocated sponsorship. These coins may be freely traded back into the market or re-sponsored by the new owner/sponsor. All sponsorCoin transactions and relationships are recorded on the SponsorCoin network and are immutable.  SponsorCoins are considered to be, “staked”, only if a beneficiary is assigned to the to the coins by the owner. The owner maintains full control of the coins and any sponsored relationships.  SponsorCoin rewards are only generated for coins which are staked, that is they have a sponsorship relationship setup by the owner/sponsor. If no sponsored recipient is provided, no rewards will be generated.   SponsorCoins are proposed to have an annual ten to twenty percent inflation with a delegated allocation of no less than 20% of the rewards delegated to the recipient/agent party and the remaining allocated to the sponsor.

Robert Lanson
Author and Technical Architect

          </p>
        </div>
      </div>
    </main>
  );
}
