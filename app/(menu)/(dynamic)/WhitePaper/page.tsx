// File: app/(menu)/(dynamic)/WhitePaper/page.tsx
'use client';

import React from 'react';

const h2Class = "mt-8 text-[20px] font-bold";

export default function WhitePaper() {
  return (
    <main className="prose prose-slate max-w-none p-8 bg-white min-h-screen text-[#000]">
      <div className="text-center mb-10">
        <h1 className="text-[30px] font-bold">SponsorCoin: A Peer-To-Peer Electronic Sponsorship System</h1>
        <h2 className="text-[20px] font-bold mt-4">SponsorCoin: A Peer-to-Peer Electronic Sponsorship System</h2>
        <h2 className="text-[20px] font-bold mt-2">Robert Lanson</h2>
        <h2 className="text-[20px] font-bold mt-2">April 2022</h2>
      </div>

      <div className="mx-[45px]">
        <p><b>Abstract:</b>A purely peer-to-peer version of sponsorship crypto would allow online payments to be sent directly from one party to another without going through a financial institution.  Financial Institutions while claiming to be secure are one of the least secure parties due partially to “Bail in Legal Tender Laws” and total disregard for privacy utilizing KYC, “Know Your Client” and other protocol tracking implementations.  We propose a solution where the free-market economy can donate sponsorCoin crypto coins while maintaining complete custody of any sponsorCoins obtained. This donation is an ongoing sponsorship implementation utilizing proof of stake and is only revoked when the coins are either unsponsored to be removed from the sponsor’s account and returned to the market, or the sponsor reallocates the coins to a new sponsor.  Newly allocated proof of stake coins will have a portion of these coins distributed to the sponsored recipient’s account with the remaining coins deposited in the sponsor’s account.  The recipient’s coins may further have a portion of the reward distributed to an agent responsible for establishing the sponsorship relationship. The proof of stake coin rewards allocated back to the parties involved shall have no allocated sponsorship. These coins may be freely traded back into the market or re-sponsored by the new owner/sponsor. All sponsorCoin transactions and relationships are recorded on the SponsorCoin network and are immutable. SponsorCoins are considered to be staked only if a recipient is assigned to the to the coins by the owner. The owner maintains full control of the coins and any sponsored relationships.  SponsorCoin rewards are only generated for coins which are staked, that is they have a sponsorship relationship setup by the owner/sponsor. If no sponsored recipient is provided, no rewards will be generated.   SponsorCoins are proposed to have an annual ten to twenty percent inflation with a delegated allocation of no less than 20% of the rewards delegated to the recipient/agent party and the remaining allocated to the sponsor.</p>
      </div>

      <h2 className={h2Class}>Introduction</h2>
      <p>Sponsorship on the Internet has come to rely almost exclusively on financial institutions serving as trusted third parties to process electronic payments. While the system works well enough for most transactions, it still suffers from the inherent weaknesses of the trust-based model. Completely non-reversible transactions are not possible since financial institutions cannot avoid mediating disputes.  Outside influencers may also play a role of interference with the transaction through regulations and other mandates warranted or not.  Transactions through a financial system always involves trust and trust is a potential point of failure.  Middleman three-tiered financial transaction costs are substantially higher in fees and latency delays. Sponsored recipients must be constantly soliciting to ensure the flow of funds required for their cause. A certain percentage of fraud is accepted as unavoidable.  These costs and payment uncertainties can be avoided in person by using physical currency, but no mechanism exists to make payments over a communications channel without a trusted third party. Finally current sponsorship systems involve the alleviation of capital from the sponsor which is a limiting factor on contributions collected for the cause.</p>
      <p>What is needed is an electronic payment system based on proof of stake instead of trust, allowing any two willing parties to transact directly with each other without the need for a trusted third party.  Transactions that are computationally impractical to reverse would protect sponsors from fraud and other outside interferences. Newly routinely generated coins through proof of stake would be distributed proportionally between the sponsor and the sponsored recipient. This form of sponsorship would ensure a constant funding supply to the sponsor and sponsored recipient.  In this paper, we propose a solution to the inefficiency of the current sponsorship systems while providing a constant flow of capitol to both the sponsor and sponsor recipient.</p>

      <h2 className={h2Class}>Technology</h2>
      <p>The initial release of sponsorCoin is a blockchain Layer 2 solution written in the solidity language deployed on a Layer 1 block chain such as Ethereum, Binance, Fantom, Solarium and others. Web 3 is utilized for transactional processing along with front end framework tools and other technologies. The sponsorship coins can be managed through layer one custodian accounts; however, a sponsorship management account app with management contracts is required to allocate and re-allocate the sponsors proportions.</p>

      <h2 className={h2Class}>Transactions</h2>
      <p>Like all layer 2 token transactions, each account owner acquires sponsorCoins into their account digitally through the acquisition of coins from an alternate layer 1 network such as Ethereum.  Other market traded coins can be used for acquiring the specified amount of sponsorCoins using atomic swaps.  SponsorCoins may be bought from supporting exchanges or directly through web sponsor recipients using a custom sponsorCoin page. A fictious Sponsors recipient “Sick Kids Hospital”, Page would Contain a dialogue like follows:</p>

      <p><b>Sample SponsorCoin Recipient Page:</b></p>
      <div className="text-center mb-10">
        <h1 className="text-[30px] font-bold">Swap For Sick Kids Hospital SponsorCoins Here</h1>
        <img
          src="/assets/docs/whitePaper/RecipientPage2.png"
          alt="Recipient Page2"
          className="w-[600px] mx-auto my-[20px]"
        />
        <h2 className={h2Class}>Image 1 (Sponsor Recipient Page)</h2>
      </div>

      <p>Upon Loading this page, the gear configurator above can be allowed to connect to a account such as Metamask.</p>
      <p>The Selected coin in this case Ethereum would be matched with the market value of SponsorCoin at the time of trade.  When swap button is selected, the desired amount is deposited to the sponsor’s account account and these sponsorCoins will be linked to the sponsored recipient. The sponsor and the sponsored recipient will share a percentage of future proof-of-stake distributions from the sponsorCoins staking pool in proportion to the amount of sponsor coins bought by the sponsor.  In this regard, both the sponsor and recipient are benefiting from the transaction.</p>
      <p>The Swap Button executes a sponsorCoin contract which exchanges the payment token with the amount of sponsorCoins purchased.  The sponsored coins are deposited into the sponsor’s account along with the sponsor recipient’s “Registered Name” or “Wallet Address”.  If a recipient’s name or address is not provided, then the coin will be deposited to the account with the recipient deemed as unallocated.</p>
      <p>The sponsorCoin account is managed through a sponsorCoin management app.  This app connects to a remote account such as Metamask through the configuration gear in the top right-hand corner.  Other configurations such as user Id and password settings are also administered here.  The configuration gear on the right of every sponsored recipient is used to reallocate or unallocated sponsorships. *</p>

      <p><b>Sample SponsorCoin Wallet Management Application:</b></p>
      <div className="text-center mb-10">
        <h1 className="text-[30px] font-bold">Sample Sponsor Coin Management App</h1>
        <img
          src="/assets/docs/whitePaper/ManagementApp2.png"
          alt="Management App2"
          className="w-[600px] mx-auto my-[20px]"
        />
        <h2 className={h2Class}>Image 2 (Sponsor Management App)</h2>
      </div>
      <p>The Buy button executes a contract to buy directly from an exchange through a third-party app like Metamask.</p>
      <p>The Sell button executes a contract to sell back to the exchange through a third party app like Metamask. *</p>
      <p><b>* Note:</b> Only coins which are unallocated may be returned to the market.  In the GUI example above, we can see that 107 coins are unallocated and ready to be sold back to the market.</p>

      <h2 className={h2Class}>Proof of Stake Distribution Allocations</h2>
      <p>SponsorCoins are proposed to have an annual ten percent (10%) inflation with a allocation of no less than 2% delegated to the sponsored party and the remaining allocated back to the sponsor.  If a sponsor’s recipient is assigned two percent (2%) then the remaining eight percent (8%) shall be deposited back to the sponsor’s account. These new proof of stake coins shall have the same proportional sponsor distribution allocation of two percent (2%) allocated to the recipient.  </p>
      <p><b>* Note:</b> The proportion of coins allocated to the recipient cannot be larger than the annual proof of stake distribution, in this case ten percent (10%).</p>
      <p>SponsorCoin proof-of-stake distributions can be expected at a minimum daily distribution rate.  The interest rates calculations per distribution cycle is calculated as:</p>
      <p> 	Annual Interest Rate</p>
      <p>--------------------------------------------</p>
      <p>(Number of annual distributions)</p>
      <p><b>Example:</b> A daily distribution at an annual rate of ten percent (10%) can be calculated as</p>
      <p>10%                                          0.0273785%</p>
      <p>------      			=    ----------------</p>
      <p>365.25 (Days in year)                 Day</p><br />

      <p><b>Example:</b>  If a sponsor allocates two percent (2%) from the ten percent (10%) to a given recipient, then the remaining eight percent (8%) shall be deposited in the sponsor’s account.</p>
      <p>Proof of stake proposed allocation rules:</p>
      <div className="ml-5">
        •	The annual proof of stake inflation is assumed to be set at ten percent (10%)<br />
        •	The minimum of sponsor is to be two percent (2%)<br />
        •	The proportion of coins allocated to the recipient cannot be larger than the annual proof of stake distribution, in this case ten percent (10%).<br />
        •	The sponsor’s account address and the recipient’s account address cannot be the same, that is you cannot sponsor yourself to collect staking rewards.<br />
        •	The sponsors proof of stake is calculated as (10% - Recipients) percent allocation.<br />
        •	If you do allocate a sponsor for your sponsorCoins, that is the coins are unallocated, then no proof-of-stake distribution shall be awarded for either the sponsor or recipient and the sponsorCoins shall not be distributed from the sponsorCoin foundation.<br />
      </div>

      <h2 className={h2Class}>Wallets</h2>
      <p><b>The Sponsor Recipient Wallet</b></p>
      <p>Anyone can become a sponsor recipient since any custodial account such as Ledger or metamask can be used to store sponsorCoins.  What is required is a level 1 address on a block chain such as Ethereum along with a account such as Metamask to buy and sell.  Once an address is obtained the user can buy and sell sponsorCoins just like any other token.  </p>
      <p>To raise capitol from other sources, a web page on the sponsor’s site is required for sponsors to buy coins from the recipient’s page.  When the coins are purchased off of the recepients page, these coins will be sent to the sponsors account with a portion of the proof-of-stake generated coins allocated to the recipient’s account. </p>
      <p>The web page, (See <b>Image 1 “Recipient Page”</b> Above), is a simple setup and can be downloaded from sponsorCoins foundation site. Once downloaded, a small configuration program is run to customize the recipient’s page which will rename the sponsorCoins page and set the recipients address for every purchase through this GUI.</p>

      <h2 className={h2Class}>Incentive</h2>
      <p>The incentive for sponsorCoin market participation is built on a symbiotic relationship between the sponsor and recipient.  There have always been cause for charity, but the benefits of sponsorCoin far outweighs traditional markets.</p>
      <p><b>The Recipient:</b> Traditionally the recipient has always had to constantly solicit funds for its cause. This has always been a constant and expensive way of doing business with a great deal of accounting and fees required for fund raisers.  This money could be better used for the cause at hand Accounting is simplified by tallying the sponsorCoins while mitigating administration expenses.  Because there is no direct out of pocket money from the sponsor, the contributions may be considerably higher through higher sponsorCoin accumulations</p>
      <p><b>The Sponsor:</b> This is the first known program where the sponsor never directly funds a cause and hence there is no direct alleviation of capitol from the sponsor.  All that is required is that the sponsor purchase coins from of a recipient’s site. That is it! For as long as the sponsor holds the coins for a given recipient, the recipient’s cause will consistently be funded through proof-of-stake sharing with the sponsor will also receive sponsor coins as an additional incentive.
      </p>

      <h2 className={h2Class}>Risk</h2>
      <p>There is no inherent risk to either party outside of negligent management practices and/or poor security. This is not however protocol risk, but rather in house risk. The protocol itself is reliant on the internet and the Level 1 host security as well as the actual sponsorCoin contracts.  As in any market, there are market risks when venturing into any market driven protocol based on demand and supply.</p>
      <p><b>In House Security</b>
        Hacking has always been a problem, not just in the Crypto market but also for the computer market in general.  Properly managed in house security implies proper security such as offline cold storage or paper accounts. Wallets which are online should have proper key management security.  Another form of contention involves third party exchanges since this involves handing over your keys.  As is well known in the industry, “Not your Keys, Not your Coins”.  So it is always advise to keep your keys in house.
      </p>
      <p><b>Reliance Risks:</b> SponsorCoin like all cryptos is reliant on internet access.  Without the internet, for the most part, you are left with nothing.  Likewise, Level 2 crypto tokens are totally reliant on level 1 protocols such as Ethereum to be constantly available.  Should either of these reliance factors fail, the system fails and there is much worse ramifications than just the sponsorCoin token.</p>
      <p><b>SponsorCoin Protocol Contract Risks:</b> SponsorCoins protocol contracts are fully audited so that risks are alleviated.  Additionally, the sponsorCoin foundation will maintain a constant offline supply of sponsorCoins to prevent unauthorized access.
      </p>
      <p><b>Sponsor Market Risks:</b> The sponsorCoin Foundation does not guarantee or set the price of sponsorCoins.  SponsorCoins are freely traded in the crypto market and like any free market the price is set on supply and demand.  This implies that if sponsorCoin is purchased as a speculation as opposed to a sponsorship, then there is always risk of loss. The primary purpose of sponsorCoin is to facilitate a new way of sponsoring causes in a free market.  One cause may attract more interest than another, implying that the value of sponsorCoin is determined through a conglomerate of sponsors.
      </p>
      <p><b>Recipient Market Risks:</b> There is no risk of loss as a sponsored recipient since no upfront cash is required to purchase any coins.  The only effort required by the recipient is the setup of the sponsorCoin page.  Other fees such as marketing your page are outside of sponsorCoins domain and totally the recipient’s risk.  The sponsorCoin cannot assure the success of any sponsorCoin project.
      </p>

      <h2 className={h2Class}>Privacy</h2>
      <p><b>Sponsor Privacy:</b> This version of sponsorCoin is not a privacy coin as it is a level 2 solution and the sponsor’s address can be tracked back to the Sponsor’s account from the recipient’s account transaction.  As the saying goes, true charity is given anonymously. What the sponsor can do is ensure that the account doing the donations has no associated person or corporation attached to it through KYC.
      </p>
      <p><b>Recipient Market Risks:</b> Since the recipient’s page is public to a known cause, generally little or no privacy can be expected here.  However, if a recipient’s account is unknown with no associated KYC then like the sponsor it is remotely possible, but this would be a black whole charity as there would be no assurance that the sponsors cause is actually being funded.
      </p>

      <h2 className={h2Class}>Market Innovations and Implementations</h2>
      <p>At the time of this writing, the blockchain cryptography revolution is young with the first blockchain Bitcoin being just over eleven years old.  In todays rapidly changing world, the crypto market represents the greatest opportunity since the invention of the internet.  The opportunities are always greatest in the latest societal evolutionary advancements.  We are in the mist of such a revolution.</p>

      <h2 className={h2Class}>Conclusion</h2>
      <p>We have proposed a system for an electronic sponsorship transaction system without relying on trust. As a level 2 coin, we discussed account coin acquisitions and distribution transactions.  We discussed how a sponsorship proof-of-stake sharing protocol could simplify today’s charitable donations with a potential mutual benefit for both the sponsor and the recipient.   We discussed the ease of setup and the reduction of accounting administration. SponsorCoin is to be considered primarily a donation system, with inherent risks if operated as a speculation.  The sponsorCoin foundation makes no guarantee of financial reward or profit in any way shape or form and all contributions are at the risk of the investor.</p>
    </main>
  );
}
