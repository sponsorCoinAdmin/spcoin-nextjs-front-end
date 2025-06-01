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
          <h2 className="mt-4 text-[20px] font-bold">SponsorCoin</h2>
          <h2 className="mt-4 text-[20px] font-bold">A JavaScript API Access Library</h2>
        </div>

        {/* Vertical Divider */}
        <div className="hidden lg:block self-stretch" style={{ width: '2px', backgroundColor: '#f87171' }}></div>

        {/* Right Panel */}
        <div className="text-base leading-7 lg:max-w-[600px] px-4">
          <span style={{ color: '#f87171', fontSize: '20px', fontWeight: 'bold' }}>
            SPONSOR COIN:
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
          <h2 className={h2Class} onClick={() => setShowOverview(!showOverview)}>
            Overview {showOverview ? '▾' : '▸'}
          </h2>
          {showOverview && (
            <div style={{ marginLeft: '20px' }}>
              <p>
                This document details the class modules the methods available to the Ethereum sponsorCoin Token contract. These class modules are JavaScript react access modules for interaction with the sponsorCoin contract on the Ethereum network. This interaction is required to manage the accounts and rewards earned by sponsors, beneficiaries, and agents of the sponsorCoin contract. All erc20 functionality methods are also implemented according to the Ethereum standards.
              </p>
              <p>
                The access modules are as follows:
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
              <p>This JavaScript react module exports the SpCoinAddMethods class, which provides methods for interacting with the SponsorCoin smart contract. It includes functionalities like adding recipients, agents, account records, and sponsorship transactions.</p>
              <p><b>Properties:</b></p>
              <ul className="list-disc list-inside ml-4">
                <li><b>spCoinContractDeployed</b> (Object): The deployed instance of the SpCoin smart contract.</li>
                <li><b>spCoinLogger</b> (Object): An instance of the SpCoinLogger class for logging purposes.</li>
                <li><b>signer</b> (Object): The signer for the SpCoin smart contract.</li>
              </ul>
              <p><b>Constructor(_spCoinContractDeployed)</b></p>
              <ul className="list-disc list-inside ml-4">
                <li><b>Description:</b> Creates an instance of SpCoinAddMethods and initializes properties.</li>
                <li><b>Parameters:</b> _spCoinContractDeployed (Object): The deployed instance of the SpCoin smart contract.</li>
              </ul>

              <p><b>Methods:</b></p>
              <ol className="list-decimal list-inside ml-4">
                <li><b>setSigner(_signer)</b>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                    <li><b>Parameters:</b> _signer: The signer to be set for the contract.</li>
                  </ul>
                </li>
                <li><b>AddRecipient(_recipientKey)</b>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds a recipient to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b> _recipientKey (string): The key of the recipient to be added.</li>
                  </ul>
                </li>
                <li><b>addRecipients(_accountKey, _recipientAccount)</b>
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
                </li>
                <li><b>addAgent(_recipientKey, _recipientRateKey, _accountAgentList)</b>
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
                </li>
                <li><b>addAgents(_recipientKey, _recipientRateKey, _agentAccountList)</b>
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
                </li>
                <li><b>addAccountRecord(_accountKey)</b>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds an account record to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b> _accountKey (string): The key of the account to be added.</li>
                  </ul>
                </li>
                <li><b>addAccountRecords(_accountListKeys)</b>
                  <ul className="list-disc ml-6">
                    <li><b>Description:</b> Adds multiple account records to the SpCoin smart contract.</li>
                    <li><b>Parameters:</b> _accountListKeys (string[]): The list of account keys to be added.</li>
                    <li><b>Returns:</b> (number): The count of successfully added account records.</li>
                  </ul>
                </li>
                <li><b>addSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty)</b>
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
                </li>
                <li><b>addAgentSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty)</b>
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
                </li>
                <li><b>addBackDatedSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty, _transactionBackDate)</b>
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
                </li>
                <li><b>addBackDatedAgentSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty, _transactionBackDate)</b>
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
                </li>
              </ol>
            </div>
          )}

          <h2 className={h2Class} onClick={() => setShowDelete(!showDelete)}>
            SpCoinDeleteMethods {showDelete ? '▾' : '▸'}
          </h2>
          {showDelete && (
            <div style={{ marginLeft: '20px' }}>
              <p>
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

              <p className="mt-4"><b>Methods:</b></p>
              <ol className="list-decimal list-inside ml-4">
                <li>
                  <b>setSigner(_signer)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                    <li><b>Parameters:</b> _signer: The signer to be set for the contract.</li>
                  </ul>
                </li>
                <li>
                  <b>deleteAccountRecord(_accountKey)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Deletes an account record from the SpCoin contract.</li>
                    <li><b>Parameters:</b> accountKey: The key of the account to be deleted.</li>
                  </ul>
                </li>
                <li>
                  <b>deleteAccountRecords(accountListKeys)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Deletes multiple account records from the SpCoin contract.</li>
                    <li><b>Parameters:</b> _accountListKeys: The list of account keys to be deleted.</li>
                  </ul>
                </li>
                <li>
                  <b>unSponsorRecipient(_sponsorKey, _recipientKey)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Un-sponsors a recipient from the SpCoin contract.</li>
                    <li><b>Parameters:</b></li>
                    <ul className="list-disc list-inside ml-6">
                      <li>sponsorKey: The key of the sponsor initiating the un-sponsorship.</li>
                      <li>recipientKey: The key of the recipient to be unsponsored.</li>
                    </ul>
                  </ul>
                </li>
                <li>
                  <b>deleteAgentRecord(_accountKey, _recipientKey, _accountAgentKey)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Deletes an agent record from the SpCoin contract.</li>
                    <li><b>Parameters:</b></li>
                    <ul className="list-disc list-inside ml-6">
                      <li>accountKey: The key of the account associated with the agent.</li>
                      <li>recipientKey: The key of the recipient associated with the agent.</li>
                      <li>accountAgentKey: The key of the agent to be deleted.</li>
                    </ul>
                  </ul>
                </li>
              </ol>
            </div>
          )}

          <h2 className={h2Class} onClick={() => setShowStaking(!showStaking)}>
            SpCoinStakingMethods {showStaking ? '▾' : '▸'}
          </h2>
          {showStaking && (
            <div style={{ marginLeft: '20px' }}>

              <h2 className="text-xl font-semibold">Module Description</h2>
              <p>
                This code defines a JavaScript module that exports the <code>SpCoinStakingMethods</code> class,
                which provides methods for interacting with the SpCoin smart contract for staking method access.
              </p>

              <h2 className="text-xl font-semibold">Properties</h2>
              <ul className="list-disc list-inside ml-4">
                <li><b>spCoinContractDeployed</b> (Object): The deployed instance of the SpCoin smart contract.</li>
                <li><b>spCoinLogger</b> (Object): An instance of the SpCoinLogger class for logging purposes.</li>
                <li><b>signer</b> (Object): The signer for the SpCoin smart contract.</li>
              </ul>

              <ul className="list-disc list-inside ml-4">
                <li>
                  <p><b>Constructor(_spCoinContractDeployed)</b></p>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Creates an instance of SpCoinStakingMethods and initializes properties.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_spCoinContractDeployed (Object): The deployed instance of the SpCoin smart contract.</li>
                      </ul>
                    </li>
                  </ul>
                </li>
              </ul>

              <p><b>Module Description:</b></p>
              <div style={{ marginLeft: '20px' }}>
                <ol className="list-decimal list-inside">
                  <li>
                    <b>setSigner(_signer)</b>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_signer: The signer to be set for the contract.</li>
                        </ul>
                      </li>
                    </ul>
                  </li>

                  <li>
                    <b>testStakingRewards(lastUpdateTime, _testUpdateTime, _interestRate, _quantity)</b>
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
                  </li>

                  <li>
                    <b>getStakingRewards(lastUpdateTime, _interestRate, _quantity)</b>
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
                  </li>

                  <li>
                    <b>getTimeMultiplier(_timeRateMultiplier)</b>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Gets the time multiplier based on the provided time rate multiplier.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_timeRateMultiplier: The time rate multiplier.</li>
                        </ul>
                      </li>
                    </ul>
                  </li>

                  <li>
                    <b>getAccountTimeInSecondeSinceUpdate(_tokenLastUpdate)</b>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Retrieves the time elapsed in seconds since the last update for a specified account.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_tokenLastUpdate: The last update time for the account.</li>
                        </ul>
                      </li>
                    </ul>
                  </li>

                  <li>
                    <b>getMillenniumTimeIntervalDivisor(_timeInSeconds)</b>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Gets the annualized percentage for the provided time in seconds.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_timeInSeconds: The time interval in seconds.</li>
                        </ul>
                      </li>
                    </ul>
                  </li>

                  <li>
                    <b>depositSponsorStakingRewards(_sponsorAccount, _recipientAccount, _recipientRate, _amount)</b>
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
                  </li>

                  <li>
                    <b>depositRecipientStakingRewards(_sponsorAccount, _recipientAccount, _recipientRate, _amount)</b>
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
                  </li>

                  <li>
                    <b>depositAgentStakingRewards(_sponsorAccount, _recipientAccount, _recipientRate, _agentAccount, _agentRate, _amount)</b>
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
                  </li>                </ol>
              </div>
            </div>
          )}

          <h2 className={h2Class} onClick={() => setShowRewards(!showRewards)}>
            SpCoinRewardsMethods {showRewards ? '▾' : '▸'}
          </h2>
          {showRewards && (
            <div style={{ marginLeft: '20px' }}>
              <p><b>Module Description:</b></p>
              <div style={{ marginLeft: '20px' }}>
                <p><b>Constructor(_spCoinContractDeployed)</b></p>
                <ol className="list-decimal list-inside">
                  <li>setSigner(_signer)</li>
                  <li>updateAccountStakingRewards (_accountKey)</li>
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
              <p>
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

              <p className="mt-4"><b>Methods:</b></p>
              <ol className="list-decimal list-inside ml-4">
                <li>
                  <b>setSigner(_signer)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_signer: The signer to be set for the contract.</li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>
                  <b>getAccountList()</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a list of all account keys.</li>
                    <li><b>Returns:</b> Promise containing the list of account keys.</li>
                  </ul>
                </li>
                <li>
                  <b>getAccountListSize()</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the size of the account list.</li>
                    <li><b>Returns:</b> Promise containing the size of the account list.</li>
                  </ul>
                </li>
                <li>
                  <b>getAccountRecipientList(_accountKey)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the list of recipients for a given account key.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_accountKey: Key of the account.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the list of recipient account keys.</li>
                  </ul>
                </li>
                <li>
                  <b>getAccountRecipientListSize(_accountKey)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the size of the recipient list for a given account key.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_accountKey: Key of the account.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the size of the recipient list.</li>
                  </ul>
                </li>
                <li>
                  <b>getAccountRecord(_accountKey)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the detailed record for a given account key, including recipient records and staking rewards.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_accountKey: Key of the account.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing the account record.</li>
                  </ul>
                </li>              <li>
                  <b>getAccountStakingRewards(_accountKey)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get staking rewards for a given account key.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_accountKey: Key of the account.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Promise containing staking rewards.</li>
                  </ul>
                </li>
                <li>
                  <b>getRewardTypeRecord(_accountKey, _rewardType, _reward)</b>
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
                </li>
                <li>
                  <b>getAccountRewardTransactionList(_rewardAccountList)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a list of reward transactions for a given account.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_rewardAccountList: List of reward accounts.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> List of reward transactions.</li>
                  </ul>
                </li>
                <li>
                  <b>getAccountRewardTransactionRecord(_rewardRecordStr)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a single reward transaction record from the serialized string.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>_rewardRecordStr: Serialized string containing reward transaction details.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> Reward transaction record.</li>
                  </ul>
                </li>
                <li>
                  <b>getAccountRateRecordList(rateRewardList)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a list of reward rate records for a given account.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>rateRewardList: List of serialized reward rates.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> List of reward rate records.</li>
                  </ul>
                </li>
                <li>
                  <b>getRateTransactionList(rewardRateRowList)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a list of rate transactions for a given reward rate row list.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>rewardRateRowList: List of serialized reward rate transactions.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> List of rate transactions.</li>
                  </ul>
                </li>
                <li>
                  <b>getSPCoinHeaderRecord(getBody)</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get the SpCoin header record, including account records if specified.</li>
                    <li><b>Parameters:</b>
                      <ul className="list-disc list-inside ml-6">
                        <li>getBody: Boolean flag indicating whether to include account records.</li>
                      </ul>
                    </li>
                    <li><b>Returns:</b> SpCoin header record.</li>
                  </ul>
                </li>
                <li>
                  <b>getAccountRecords()</b>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>Description:</b> Get a list of all account records.</li>
                    <li><b>Returns:</b> Promise containing the list of account records.</li>
                  </ul>
                </li>
                <li>
                  <b>getAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getAgentRateRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</b>
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
                </li>

                <li>
                  <b>getAgentRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getAgentRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentAccountList)</b>
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
                </li>

                <li>
                  <b>getAgentRateTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</b>
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
                </li>
                <li>
                  <b>getAgentTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getRecipientRateTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</b>
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
                </li>

                <li>
                  <b>getRecipientTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getSponsorRecipientTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getRecipientRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getRecipientRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getRecipientRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getRecipientRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getRecipientRateRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _recipientRate)</b>
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
                </li>

                <li>
                  <b>getRecipientRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>
                <li>
                  <b>getRewardRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getSponsorRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getSponsorRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getRewardTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getRewardTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getRewardRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getRewardTypeRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>

                <li>
                  <b>getRecipientRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>
                <li>
                  <b>getAgentRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>
                <li>
                  <b>getSponsorRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b>
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
                </li>
              </ol>
              <p className="mt-4"><i>Methods continued in subsequent documentation...</i></p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
