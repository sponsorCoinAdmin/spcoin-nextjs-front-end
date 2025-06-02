'use client';

import React, { useState } from 'react';

const h2Class = 'mt-4 text-[20px] font-bold cursor-pointer';

export default function WhitePaper() {
  const [showOverview, setShowOverview] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showStaking, setShowStaking] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showRead, setShowRead] = useState(false);

  return (
    <main className="prose max-w-none p-8 bg-white min-h-screen" style={{ color: '#000' }}>
      {/* Flex container */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-10">
        {/* Left Panel */}
        <div className="flex flex-col items-center max-w-full lg:max-w-[600px]">
          <img
            src="/docs/spCoinAPI/spCoinLogo.png"
            alt="spCoin Logo"
            className="w-full max-w-[600px] h-auto mb-4"
          />
          <h2 className="mt-4 text-[24px] font-bold text-[#f87171]">SponsorCoin</h2>
          <h2 className="mt-4 text-[20px] font-bold">A JavaScript Node API Access Library</h2>
        </div>
        {/* Vertical Divider */}
        <div className="hidden lg:block self-stretch" style={{ width: '2px', backgroundColor: '#f87171' }}></div>

        {/* Right Panel */}
        <div className="text-base leading-7 lg:max-w-[600px] px-4">
          <span style={{ color: '#f87171', fontSize: '20px', fontWeight: 'bold' }}>
            SPONSOR COIN API'S:
          </span>
          <br />
          The SponsorCoin protocol propose a solution where the free-market economy can donate sponsorCoin crypto coins to there cause with no cost of any kind from the sponsor’s portfolio. The sponsorCoin owner maintains complete custody of any sponsorCoins obtained. The owner of the coin may generate staking rewards by identifying a sponsored beneficiary as a worthwhile cause and assigning the beneficiary’s Ethereum address to share in the staking rewards. The coin owner/sponsor never relinquishes any of his sponsorCoin investment but instead simply shares the proof of stake rewards with their chosen charity. This donation is an ongoing sponsorship implementation ,utilizing proof of stake and is only revoked when the coins are either unsponsored to be removed from the sponsor’s wallet and returned to the market, or the sponsor reallocates the coins to a new sponsor.  Newly allocated proof of stake coins will have a portion of these coins distributed to the sponsored recipient’s wallet with the remaining coins deposited in the sponsor’s wallet.  The recipient’s coins may further have a portion of the reward distributed to an agent responsible for establishing the sponsorship relationship. The proof of stake coin rewards allocated back to the parties involved shall have no allocated sponsorship. These coins may be freely traded back into the market or re-sponsored by the new owner/sponsor. All sponsorCoin transactions and relationships are recorded on the SponsorCoin network and are immutable.  SponsorCoins are considered to be, “staked”, only if a beneficiary is assigned to the to the coins by the owner. The owner maintains full control of the coins and any sponsored relationships.  SponsorCoin rewards are only generated for coins which are staked, that is they have a sponsorship relationship setup by the owner/sponsor. If no sponsored recipient is provided, no rewards will be generated.   SponsorCoins are proposed to have an annual ten to twenty percent inflation with a delegated allocation of no less than 20% of the rewards delegated to the recipient/agent party and the remaining allocated to the sponsor.          <br />
          <br />
          <div style={{ color: '#f87171', fontSize: '20px', fontWeight: 'bold' }}>
            Robert Lanson
          </div>
          <b>Author and Technical Architect</b>
        </div>
      </div>

      {/* Collapsible Contents Section */}
      <div className="mt-10 px-4 lg:px-0">
        <div className="text-center mb-10">
          <h1 className="text-[30px] font-bold">Contents</h1>
        </div>

        <div style={{ marginLeft: '45px', marginRight: '45px' }}>
          <h2 className={h2Class} onClick={() => setShowOverview(!showOverview)} style={{ color: '#f87171', fontSize: '24px', fontWeight: 'bold' }}>
            Sponsor Coin API Library Overview {showOverview ? '▾' : '▸'}
          </h2>
          {showOverview && (
            <div style={{ marginLeft: '20px' }}>
              <p>
                <b>NPM Module Description:</b>This document details the class modules the methods available to the Ethereum sponsorCoin Token contract. These class modules are JavaScript react access modules for interaction with the sponsorCoin contract on the Ethereum network. This interaction is required to manage the accounts and rewards earned by sponsors, beneficiaries, and agents of the sponsorCoin contract. All erc20 functionality methods are also implemented according to the Ethereum standards.
              </p>
              <p>
                <b>NPM Installation:</b>This project requires Node 18.16.0 or later. You can install it using the following command:
 npm i @sponsorcoin/spcoin-access-modules
              </p>
              <p>
                The access modules in this package are as follows:
                <br />
                <b>SpCoinAddMethods:</b> This module includes functionalities like adding sponsorships, recipients, agents, account records, and sponsorship transactions. The module generates backdated data for testing purposes involving staking over time.
                <br />
                <b>SpCoinDeleteMethods:</b> This module includes functionalities like deleting recipients, agents, account records, and sponsorships. Its primary purpose is to un-sponsor tokens called SponsorCoins so that they may be resold in the crypto token market.
                <br />
                <b>SpCoinStakingMethods:</b> This module includes functionalities pertaining to staking functionality such as calculating the staking rewards since last claimed and depositing the rewards to the erc20 balanceOf account, based on time method calculations. Rewards are allocated according to the proportion assigned between the Sponsor, Recipient and Agent allocations.
                <br />
                <b>SpCoinRewardsMethods:</b> This module updates the staking rewards for a given account. There are three types of awards which may be generated for any account. Sponsor rewards, Recipient Rewards and Agent Rewards. Any account can be a Sponsor, Recipient, Agent, none, one, two or all three of these entities and hence may have multiple SponsorCoin reward sources attached to their address identities.
                <br />
                <b>SpCoinReadMethods:</b> This module requests data which is existing on the blockchain and hence is read only so no signer is required and no network fees are incurred. Such read functions include get a list of recipients or agents or beneficiaries. Get a list of transactions such as rewards generated reward balances and so on. This class is ideal for an account display page for administrative work such as analyzing transactions or determining which beneficiaries to add to or delete from.
                <br />
                <b>spCoinERC20Methods:</b> This module requests standard erc20 request and is currently under review for modifications. Currently it is a WIP.
              </p>
            </div>
          )}

          <h2 className={h2Class} onClick={() => setShowAdd(!showAdd)}>
            SpCoinAddMethods {showAdd ? '▾' : '▸'}
          </h2>
          {showAdd && (
            <div style={{ marginLeft: '20px' }}>
              <p><b>Module Description:</b></p>
              <p style={{ marginLeft: '20px' }}>This JavaScript react module exports the SpCoinAddMethods class, which provides methods for interacting with the SponsorCoin smart contract. It includes functionalities like adding recipients, agents, account records, and sponsorship transactions.</p>
              <p><b>Properties:</b></p>
              <ul className="list-disc list-inside ml-4">
                <li><b>spCoinContractDeployed</b> (Object): The deployed instance of the SpCoin smart contract.</li>
                <li><b>spCoinLogger</b> (Object): An instance of the SpCoinLogger class for logging purposes.</li>
                <li><b>signer</b> (Object): The signer for the SpCoin smart contract.</li>
              </ul>
              <p><b>Constructor(_spCoinContractDeployed)</b></p>
              <ul className="list-disc list-inside ml-4">
                <li><b>Description:</b> Creates an instance of SpCoinAddMethods and initializes properties.</li>
                <li><b>Parameters:</b>
                  <ul className="list-disc list-inside ml-6">
                    <li> _spCoinContractDeployed (Object): The deployed instance of the SpCoin smart contract.</li>
                  </ul>
                </li>
              </ul>

              <p><b>Methods:</b></p>
              <ol className="list-decimal list-inside ml-4">
                <details>
                  <summary className="cursor-pointer font-semibold">1. setSigner(_signer)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_signer: The signer account to be set for the contract credential security access.</li>
                      </ul>
                    </li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">2. addRecipient(_recipientKey)</summary>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds a recipient to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b></li>
                    <ul className="list-disc ml-6">
                      <li>_recipientKey (string): The key of the recipient to be added.</li>
                    </ul>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">3. addRecipients(_accountKey, _recipientAccount)</summary>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds multiple recipients to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc ml-6">
                        <li>_accountKey (string): The key of the account associated with the recipients.</li>
                        <li>_recipientAccountList (string []): The list of recipient keys to be added.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> (number): The count of successfully added recipients.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">4. addAgent(_recipientKey, _recipientRateKey, _accountAgentList)</summary>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds an agent to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc ml-6">
                        <li>_recipientKey (string): The key of the associated recipient.</li>
                        <li>_recipientRateKey (string): The key representing the rate of the recipient.</li>
                        <li>_accountAgentKey (string): The key of the agent to be added.</li>
                      </ul>
                    </li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">5. addAgents(_recipientKey, _recipientRateKey, _agentAccountList)</summary>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds multiple agents to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc ml-6">
                        <li>_recipientKey (string): The key of the associated recipient.</li>
                        <li>_recipientRateKey (string): The key representing the rate of the recipient.</li>
                        <li>_agentAccountList (string[]): The list of agent keys to be added.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> (number): The count of successfully added agents.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">6. addAccountRecord(_accountKey)</summary>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds an account record to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b></li>
                    <ul className="list-disc ml-6">
                      <li>_accountKey (string): The key of the account to be added.</li>
                    </ul>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">7. addAccountRecords(_accountListKeys)</summary>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds multiple account records to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b></li>
                    <ul className="list-disc ml-6">
                      <li>_accountListKeys (string[]): The list of account keys to be added.</li>
                    </ul>
                    <li><b>Returns:</b> (number): The count of successfully added account records.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">8. addSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty)</summary>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds a sponsorship transaction to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc ml-6">
                        <li>_sponsorSigner (Object): The signer of the sponsoring account.</li>
                        <li>_recipientKey (string): The key of the sponsored recipient.</li>
                        <li>_recipientRateKey (string): The key representing the rate of the recipient.</li>
                        <li>_transactionQty (number): The quantity of the sponsorship transaction.</li>
                      </ul>
                    </li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">9. addAgentSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty)</summary>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds an agent sponsorship transaction to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc ml-6">
                        <li>_sponsorSigner (Object): The signer of the sponsoring account.</li>
                        <li>_recipientKey (string): The key of the sponsored recipient.</li>
                        <li>_recipientRateKey (string): The key representing the rate of the recipient.</li>
                        <li>_accountAgentKey (string): The key of the sponsored agent.</li>
                        <li>_agentRateKey (string): The key representing the rate of the agent.</li>
                        <li>_transactionQty (number): The quantity of the agent sponsorship transaction.</li>
                      </ul>
                    </li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">10. addBackDatedSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty, _transactionBackDate)</summary>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds a backdated sponsorship transaction to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc ml-6">
                        <li>_sponsorSigner (Object): The signer of the sponsoring account.</li>
                        <li>_recipientKey (string): The key of the sponsored recipient.</li>
                        <li>_recipientRateKey (string): The key representing the rate of the recipient.</li>
                        <li>_transactionQty (number): The quantity of the backdated sponsorship transaction.</li>
                        <li>_transactionBackDate (number): The timestamp of the backdated sponsorship transaction.</li>
                      </ul>
                    </li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">11. addBackDatedAgentSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty, _transactionBackDate)</summary>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds a backdated agent sponsorship transaction to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc ml-6">
                        <li>_sponsorSigner (Object): The signer of the sponsoring account.</li>
                        <li>_recipientKey (string): The key of the sponsored recipient.</li>
                        <li>_recipientRateKey (string): The key representing the rate of the recipient.</li>
                        <li>_accountAgentKey (string): The key of the sponsored agent.</li>
                        <li>_agentRateKey (string): The key representing the rate of the agent.</li>
                        <li>_transactionQty (number): The quantity of the backdated agent sponsorship transaction.</li>
                        <li>_transactionBackDate (number): The timestamp of the backdated agent sponsorship transaction.</li>
                      </ul>
                    </li>
                  </ul>
                </details>
              </ol>
            </div>
          )}

          <h2 className={h2Class} onClick={() => setShowDelete(!showDelete)}>
            SpCoinDeleteMethods {showDelete ? '▾' : '▸'}
          </h2>
          {showDelete && (
            <div style={{ marginLeft: '20px' }}>
              <p ><b>Module Description:</b></p>
              <p style={{ marginLeft: '20px' }}>
                This module exports the <b>SpCoinDeleteMethods</b> class, which provides methods for interacting with the SpCoin smart contract. It includes functionalities like deleting recipients, agents, account records, and sponsorships. This module also exports the SpCoinDeleteMethods for integration into other JavaScript programs.
              </p>
              <p><b>Properties:</b></p>
              <ul className="list-disc list-inside ml-4">
                <li><b>spCoinContractDeployed (Object):</b> The deployed instance of the SpCoin smart contract.</li>
                <li><b>spCoinLogger (Object):</b> An instance of the SpCoinLogger class for logging purposes.</li>
                <li><b>signer (Object):</b> The signer for the SpCoin smart contract.</li>
              </ul>
              <p><b>Constructor(_spCoinContractDeployed)</b></p>
              <div style={{ marginLeft: '20px' }}>
                <p><b>Description:</b></p>
                <p>Creates an instance of SpCoinDeleteMethods and initializes properties.</p>
                <p><b>Parameters:</b></p>
                <ul className="list-disc list-inside ml-4">
                  <li>_spCoinContractDeployed (Object): The deployed instance of the SpCoin smart contract.</li>
                </ul>
              </div>

              <p><b>Methods:</b></p>
              <ol className="list-decimal list-inside ml-4">
                <details>
                  <summary className="cursor-pointer font-semibold">1. setSigner(_signer)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_signer: The signer account to be set for the contract credential security access.</li>
                      </ul>
                    </li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">2. deleteAccountRecord(_accountKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Deletes an account record from the SpCoin contract.</li>
                    <li><b>Parameters:</b></li>
                    <ul className="list-disc ml-6">
                      <li>accountKey: The key of the account to be deleted.</li>
                    </ul>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">3. deleteAccountRecords(accountListKeys)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Deletes multiple account records from the SpCoin contract.</li>
                    <li><b>Parameters:</b></li>
                    <ul className="list-disc ml-6">
                      <li>_accountListKeys: The list of account keys to be deleted.</li>
                    </ul>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">4. unSponsorRecipient(_sponsorKey, _recipientKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Un-sponsors a recipient from the SpCoin contract.</li>
                    <li><b>Parameters:</b></li>
                    <ul className="list-disc list-inside ml-6">
                      <li>sponsorKey: The key of the sponsor initiating the un-sponsorship.</li>
                      <li>recipientKey: The key of the recipient to be unsponsored.</li>
                    </ul>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">5. deleteAgentRecord(_accountKey, _recipientKey, _accountAgentKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Deletes an agent record from the SpCoin contract.</li>
                    <li><b>Parameters:</b></li>
                    <ul className="list-disc list-inside ml-6">
                      <li>accountKey: The key of the account associated with the agent.</li>
                      <li>recipientKey: The key of the recipient associated with the agent.</li>
                      <li>accountAgentKey: The key of the agent to be deleted.</li>
                    </ul>
                  </ul>
                </details>
              </ol>
            </div>
          )}

          <h2 className={h2Class} onClick={() => setShowStaking(!showStaking)}>
            SpCoinStakingMethods {showStaking ? '▾' : '▸'}
          </h2>
          {showStaking && (
            <div style={{ marginLeft: '20px' }}>

              <p><b>Module Description:</b></p>
              <p style={{ marginLeft: '20px' }}>
                This code defines a JavaScript module that exports the <code>SpCoinStakingMethods</code> class,
                which provides methods for interacting with the SpCoin smart contract for staking method access.
              </p>

              <p><b>Properties:</b></p>
              <ul className="list-disc list-inside ml-4">
                <li><b>spCoinContractDeployed</b> (Object): The deployed instance of the SpCoin smart contract.</li>
                <li><b>spCoinLogger</b> (Object): An instance of the SpCoinLogger class for logging purposes.</li>
                <li><b>signer</b> (Object): The signer for the SpCoin smart contract.</li>
              </ul>

              <ul className="list-disc list-inside">
                <p><b>Constructor(_spCoinContractDeployed)</b></p>
                <ul className="list-disc list-inside ml-4">
                  <li><b>Description:</b> Creates an instance of SpCoinStakingMethods and initializes properties.</li>
                  <li><b>Parameters:</b>
                    <ul className="list-disc list-inside ml-6">
                      <li>_spCoinContractDeployed (Object): The deployed instance of the SpCoin smart contract.</li>
                    </ul>
                  </li>
                </ul>
              </ul>

              <p><b>Methods:</b></p>
              <div style={{ marginLeft: '20px' }}>
                <ol className="list-decimal list-inside">
                  <details><summary><b>1. setSigner(_signer)</b></summary>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_signer: The signer account to be set for the contract credential security access.</li>
                        </ul>
                      </li>
                    </ul>
                  </details>

                  <details><summary><b>2. testStakingRewards(lastUpdateTime, _testUpdateTime, _interestRate, _quantity)</b></summary>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Tests staking rewards by simulating a staking operation.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_lastUpdateTime: The last update time for staking rewards.</li>
                          <li>_testUpdateTime: The simulated time for testing staking rewards.</li>
                          <li>_interestRate: The interest rate for staking rewards.</li>
                          <li>_quantity: The quantity to be staked.</li>
                        </ul>
                      </li>
                    </ul>
                  </details>

                  <details><summary><b>3. getStakingRewards(lastUpdateTime, _interestRate, _quantity)</b></summary>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Retrieves staking rewards for a specified account.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_lastUpdateTime: The last update time for staking rewards.</li>
                          <li>_interestRate: The interest rate for staking rewards.</li>
                          <li>_quantity: The quantity to be staked.</li>
                        </ul>
                      </li>
                    </ul>
                  </details>

                  <details><summary><b>4. getTimeMultiplier(_timeRateMultiplier)</b></summary>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Gets the time multiplier based on the provided time rate multiplier.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_timeRateMultiplier: The time rate multiplier.</li>
                        </ul>
                      </li>
                    </ul>
                  </details>

                  <details><summary><b>5. getAccountTimeInSecondeSinceUpdate(_tokenLastUpdate)</b></summary>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Retrieves the time elapsed in seconds since the last update for a specified account.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_tokenLastUpdate: The last update time for the account.</li>
                        </ul>
                      </li>
                    </ul>
                  </details>

                  <details><summary><b>6. getMillenniumTimeIntervalDivisor(_timeInSeconds)</b></summary>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Gets the annualized percentage for the provided time in seconds.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_timeInSeconds: The time interval in seconds.</li>
                        </ul>
                      </li>
                    </ul>
                  </details>

                  <details><summary><b>7. depositSponsorStakingRewards(_sponsorAccount, _recipientAccount, _recipientRate, _amount)</b></summary>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Deposits staking rewards for the sponsor account.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_sponsorAccount: The sponsor account.</li>
                          <li>_recipientAccount: The recipient account.</li>
                          <li>_recipientRate: The recipient rate.</li>
                          <li>_amount: The amount to be staked.</li>
                        </ul>
                      </li>
                    </ul>
                  </details>

                  <details><summary><b>8. depositRecipientStakingRewards(_sponsorAccount, _recipientAccount, _recipientRate, _amount)</b></summary>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Deposits staking rewards for the recipient account.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_sponsorAccount: The sponsor account.</li>
                          <li>_recipientAccount: The recipient account.</li>
                          <li>_recipientRate: The recipient rate.</li>
                          <li>_amount: The amount to be staked.</li>
                        </ul>
                      </li>
                    </ul>
                  </details>

                  <details><summary><b>9. depositAgentStakingRewards(_sponsorAccount, _recipientAccount, _recipientRate, _agentAccount, _agentRate, _amount)</b></summary>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Deposits staking rewards for the agent account.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_sponsorAccount: The sponsor account.</li>
                          <li>_recipientAccount: The recipient account.</li>
                          <li>_recipientRate: The recipient rate.</li>
                          <li>_agentAccount: The agent account.</li>
                          <li>_agentRate: The agent rate.</li>
                          <li>_amount: The amount to be staked.</li>
                        </ul>
                      </li>
                    </ul>
                  </details>
                </ol>
              </div>
            </div>
          )}

          <h2 className={h2Class} onClick={() => setShowRewards(!showRewards)}>
            SpCoinRewardsMethods {showRewards ? '▾' : '▸'}
          </h2>
          {showRewards && (
            <div style={{ marginLeft: '20px' }}>
              <p><b>Module Description:</b></p>
              <p style={{ marginLeft: '20px' }}>
                This class updates rewards for Sponsors, Agents, and Recipients based on a timing and reward allocation algorithm.
              </p>

              <div style={{ marginLeft: '20px' }}>
                <p><b>Constructor(_spCoinContractDeployed)</b></p>
                <ol className="list-decimal list-inside">
                  <details>
                    <summary className="cursor-pointer font-semibold">1. setSigner(_signer)</summary>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_signer: The signer account to be set for the contract credential security access.</li>
                        </ul>
                      </li>
                    </ul>
                  </details>

                  <details>
                    <summary className="cursor-pointer font-semibold">2. updateAccountStakingRewards(_accountKey)</summary>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Updates staking rewards for a specified account.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_accountKey: Account for which the rewards are to be updated.</li>
                        </ul>
                      </li>
                    </ul>
                  </details>
                </ol>
                <p><b>Exporting the Module:</b> The module exports an object with a single property <code>SpCoinRewardsMethods</code> which holds the class.</p>
              </div>
            </div>
          )}

          <h2 className={h2Class} onClick={() => setShowRead(!showRead)}>
            SpCoinReadMethods {showRead ? '▾' : '▸'}
          </h2>
          {showRead && (
            <div style={{ marginLeft: '20px' }}>
              <p><b>Module Description:</b></p>
              <p style={{ marginLeft: '20px' }}>
                This class provides read methods to interact with a SpCoin contract. It has methods to retrieve information about accounts, recipients, agents, and reward-related data.
              </p>
              <p><b>Constructor(_spCoinContractDeployed)</b></p>
              <div style={{ marginLeft: '20px' }}>
                <p><b>Description:</b> Creates an instance of SpCoinReadMethods and initializes properties.</p>
                <p><b>Parameters:</b></p>
                <ul className="list-disc list-inside ml-4">
                  <li>_spCoinContractDeployed (Object): The deployed instance of the SpCoin smart contract.</li>
                </ul>
              </div>

              <p><b>Methods:</b></p>
              <ol className="list-decimal list-inside ml-4">
                <details>
                  <summary className="cursor-pointer font-semibold">1. setSigner(_signer)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_signer: The signer account to be set for the contract credential security access.</li>
                      </ul>
                    </li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">2. getAccountList()</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a list of all account keys.</li>
                    <li><b>Returns:</b> Promise containing the list of account keys.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">3. getAccountListSize()</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the size of the account list.</li>
                    <li><b>Returns:</b> Promise containing the size of the account list.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">4. getAccountRecipientList(_accountKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of recipients for a given account key.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_accountKey: Key of the account.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of recipient account keys.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">5. getAccountRecipientListSize(_accountKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the size of the recipient list for a given account key.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_accountKey: Key of the account.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the size of the recipient list.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">6. getAccountRecord(_accountKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the detailed record for a given account key, including recipient records and staking rewards.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_accountKey: Key of the account.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the account record.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">7. getAccountStakingRewards(_accountKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get staking rewards for a given account key.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_accountKey: Key of the account.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing staking rewards.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">8. getRewardTypeRecord(_accountKey, _rewardType, _reward)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get reward type record for a specific account, including sponsor, recipient, or agent rewards.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_accountKey: Key of the account.</li>
                        <li>_rewardType: Type of reward (SPONSOR, RECIPIENT, or AGENT).</li>
                        <li>_reward: Reward value.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the reward type record.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">9. getAccountRewardTransactionList(_rewardAccountList)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a list of reward transactions for a given account.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_rewardAccountList: List of reward accounts.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> List of reward transactions.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">10. getAccountRewardTransactionRecord(_rewardRecordStr)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a single reward transaction record from the serialized string.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_rewardRecordStr: Serialized string containing reward transaction details.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Reward transaction record.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">11. getAccountRateRecordList(rateRewardList)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a list of reward rate records for a given account.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>rateRewardList: List of serialized reward rates.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> List of reward rate records.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">12. getRateTransactionList(rewardRateRowList)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a list of rate transactions for a given reward rate row list.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>rewardRateRowList: List of serialized reward rate transactions.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> List of rate transactions.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">13. getSPCoinHeaderRecord(getBody)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the SpCoin header record, including account records if specified.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>getBody: Boolean flag indicating whether to include account records.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> SpCoin header record.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">14. getAccountRecords()</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a list of all account records.</li>
                    <li><b>Returns:</b> Promise containing the list of account records.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">15. getAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of agent rates for a specific agent.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of agent rates.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">16. getAgentRateRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the agent rate record for a specific agent rate key.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                        <li>_agentRateKey: Key of the agent rate.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the agent rate record.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">17. getAgentRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of agent rate records for a specific agent.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of agent rate records.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">18. getAgentRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the agent record for a specific agent.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the agent record.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">19. getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentAccountList)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of agent records for a list of agent accounts.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentAccountList: List of agent accounts.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of agent records.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">20. getAgentRateTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of agent rate transactions for a specific agent rate.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorCoin: Sponsor coin key.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                        <li>_agentRateKey: Key of the agent rate.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of agent rate transactions.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">21. getAgentTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of agent transactions for a specific agent.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of agent transactions.</li>
                  </ul>
                </details>

                <details>
                  <summary className="cursor-pointer font-semibold">22. getRecipientRateTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of recipient rate transactions for a specific recipient rate.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                        <li>_agentRateKey: Key of the agent rate.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of recipient rate transactions.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>23. getRecipientTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of recipient transactions for a specific recipient.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of recipient transactions.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>24. getSponsorRecipientTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of sponsor-recipient transactions for a specific recipient.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of sponsor-recipient transactions.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>25. getRecipientRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of recipient rate records for a specific recipient.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of recipient rate records.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>26. getRecipientRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the recipient record for a specific recipient.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the recipient record.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>27. getRecipientRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of recipient records for a specific recipient.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of recipient records.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>28. getRecipientRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of recipient rates for a specific recipient.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of recipient rates.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>29. getRecipientRateRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _recipientRate)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the recipient rate record for a specific recipient rate.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                        <li>_recipientRate: Key of the recipient rate.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the recipient rate record.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>30. getRecipientRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of recipient rate records for a specific recipient.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of recipient rate records.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>31. getRewardRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of reward rate records for a specific recipient.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of reward rate records.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>32. getSponsorRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the sponsor record for a specific sponsor.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the sponsor record.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>33. getSponsorRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of sponsor records for a list of sponsor accounts.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of sponsor records.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>34. getRewardTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of reward transactions for a specific sponsor.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of reward transactions.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>35. getRewardTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of reward types for a specific sponsor.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of reward types.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>36. getRewardRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of reward records for a specific sponsor account.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of reward records.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>37. getRewardTypeRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of reward type records for a specific sponsor account.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of reward type records.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>38. getRecipientRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of recipient rate types for a specific sponsor account.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of recipient rate types.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>39. getAgentRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of agent rate types for a specific sponsor account.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of agent rate types.</li>
                  </ul>
                </details>

                <details>
                  <summary><b>40. getSponsorRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></summary>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of sponsor rate types for a specific sponsor account.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_sponsorKey: Key of the sponsor.</li>
                        <li>_recipientKey: Key of the recipient.</li>
                        <li>_recipientRateKey: Key of the recipient rate.</li>
                        <li>_agentKey: Key of the agent.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of sponsor rate types.</li>
                  </ul>
                </details>
              </ol>
              <p className="mt-4"><i>Methods continued in subsequent documentation...</i></p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
