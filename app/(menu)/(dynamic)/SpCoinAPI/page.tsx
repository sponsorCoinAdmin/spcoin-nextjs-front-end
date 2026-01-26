'use client';

import React, { useState } from 'react';

const h2Class = 'mt-4 text-[20px] font-bold cursor-pointer';

export default function WhitePaper() {
  const [showOverview, setShowOverview] = useState(false);

  // Top-level Libraries toggle (now outside Overview)
  const [showLibraries, setShowLibraries] = useState(false);

  // Section toggles
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showStaking, setShowStaking] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showRead, setShowRead] = useState(false);

  // Methods toggles
  const [showAddMethods, setShowAddMethods] = useState(false);
  const [showDeleteMethods, setShowDeleteMethods] = useState(false);
  const [showStakingMethods, setShowStakingMethods] = useState(false);
  const [showRewardsMethods, setShowRewardsMethods] = useState(false);
  const [showReadMethods, setShowReadMethods] = useState(false);

  return (
    <main className="prose prose-slate max-w-none p-8 bg-white min-h-screen text-[#000]">
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
        <div className="hidden lg:block self-stretch w-[2px] bg-[#f87171]" aria-hidden="true" />
        {/* Right Panel */}
        <div className="text-base leading-7 lg:max-w-[600px] px-4">
          <span className="!text-[#f87171] text-xl font-bold">
            SPONSOR COIN API&apos;S:
          </span>
          <br />
          The SponsorCoin protocol propose a solution where the free-market economy can donate sponsorCoin crypto coins to there cause with no cost of any kind from the sponsor’s portfolio. The sponsorCoin owner maintains complete custody of any sponsorCoins obtained. The owner of the coin may generate staking rewards by identifying a sponsored beneficiary as a worthwhile cause and assigning the beneficiary’s Ethereum address to share in the staking rewards. The coin owner/sponsor never relinquishes any of his sponsorCoin investment but instead simply shares the proof of stake rewards with their chosen charity. This donation is an ongoing sponsorship implementation ,utilizing proof of stake and is only revoked when the coins are either unsponsored to be removed from the sponsor’s account and returned to the market, or the sponsor reallocates the coins to a new sponsor.  Newly allocated proof of stake coins will have a portion of these coins distributed to the sponsored recipient’s account with the remaining coins deposited in the sponsor’s account.  The recipient’s coins may further have a portion of the reward distributed to an agent responsible for establishing the sponsorship relationship. The proof of stake coin rewards allocated back to the parties involved shall have no allocated sponsorship. These coins may be freely traded back into the market or re-sponsored by the new owner/sponsor. All sponsorCoin transactions and relationships are recorded on the SponsorCoin network and are immutable.  SponsorCoins are considered to be, “staked”, only if a beneficiary is assigned to the to the coins by the owner. The owner maintains full control of the coins and any sponsored relationships.  SponsorCoin rewards are only generated for coins which are staked, that is they have a sponsorship relationship setup by the owner/sponsor. If no sponsored recipient is provided, no rewards will be generated.   SponsorCoins are proposed to have an annual ten to twenty percent inflation with a delegated allocation of no less than 20% of the rewards delegated to the recipient/agent party and the remaining allocated to the sponsor.          <br />
          <br />
          <div className="text-[20px] font-bold text-[#f87171]">
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

        <div className="mx-[45px]">
          {/* Overview header */}
          <h2
            className={`${h2Class} !text-[24px] font-bold !text-[#f87171]`}
            onClick={() => setShowOverview(!showOverview)}
          >
            Sponsor Coin API Library Overview {showOverview ? '▾' : '▸'}
          </h2>

          {/* Overview body */}
          {showOverview && (
            <div className="ml-5 mt-2">
              <p>
                <b>NPM Module Description:</b>
                This document details the class modules the methods available to the Ethereum sponsorCoin Token contract. These class modules are JavaScript react access modules for interaction with the sponsorCoin contract on the Ethereum network. This interaction is required to manage the accounts and rewards earned by sponsors, beneficiaries, and agents of the sponsorCoin contract. All erc20 functionality methods are also implemented according to the Ethereum standards.
              </p>
              <p>
                <b>NPM Installation:</b>
                This project requires Node 18.16.0 or later. You can install it using the following command:{' '}
                <span className="font-bold text-blue-600 underline">npm i @sponsorcoin/spcoin-access-modules</span>
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

          {/* Libraries group — SAME STYLE as Overview */}
          <h2
            className={`${h2Class} !text-[24px] font-bold !text-[#f87171]`}
            onClick={() => setShowLibraries(v => !v)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowLibraries(v => !v);
              }
            }}
            tabIndex={0}
            role="button"
            aria-expanded={showLibraries}
          >
            Sponsor Coin API Libraries <span className="ml-2">{showLibraries ? '▾' : '▸'}</span>
          </h2>

          {showLibraries && (
            <>
              {/* SpCoinAddMethods (indented) */}
              <h2 className={`${h2Class} !mt-0 ml-5`} onClick={() => setShowAdd(!showAdd)}>
                SpCoinAddMethods {showAdd ? '▾' : '▸'}
              </h2>
              {showAdd && (
                <div className="ml-10">
                  <p><b>Module Description:</b></p>
                  <p className="ml-[20px]">This JavaScript react module exports the SpCoinAddMethods class, which provides methods for interacting with the SponsorCoin smart contract. It includes functionalities like adding recipients, agents, account records, and sponsorship transactions.</p>
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

                  {/* Methods toggler */}
                  <p
                    className="!mt-0 mb-0 font-bold leading-[1.05] text-base inline-flex items-center cursor-pointer select-none"
                    onClick={() => setShowAddMethods(v => !v)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setShowAddMethods(v => !v);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={showAddMethods}
                  >
                    Methods <span className="ml-2 font-normal">{showAddMethods ? '▾' : '▸'}</span>
                  </p>

                  {showAddMethods && (
                    <ol className="list-decimal pl-8 ml-[0.5ch] marker:font-bold [&>li]:mb-[2px] mt-0.5">
                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">setSigner(_signer)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_signer: The signer account to be set for the contract credential security access.</li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">addRecipient(_recipientKey)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Adds a recipient to the SpCoin smart contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_recipientKey (string): The key of the recipient to be added.</li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">addRecipients(_accountKey, _recipientAccount)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Adds multiple recipients to the SpCoin smart contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_accountKey (string): The key of the account associated with the recipients.</li>
                                <li className="leading-[1.05]">_recipientAccountList (string []): The list of recipient keys to be added.</li>
                              </ul>
                            </li>
                            <li className="leading-[1.05]"><b>Returns:</b> (number): The count of successfully added recipients.</li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">addAgent(_recipientKey, _recipientRateKey, _accountAgentList)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Adds an agent to the SpCoin smart contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_recipientKey (string): The key of the associated recipient.</li>
                                <li className="leading-[1.05]">_recipientRateKey (string): The key representing the rate of the recipient.</li>
                                <li className="leading-[1.05]">_accountAgentKey (string): The key of the agent to be added.</li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">addAgents(_recipientKey, _recipientRateKey, _agentAccountList)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Adds multiple agents to the SpCoin smart contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_recipientKey (string): The key of the associated recipient.</li>
                                <li className="leading-[1.05]">_recipientRateKey (string): The key representing the rate of the recipient.</li>
                                <li className="leading-[1.05]">_agentAccountList (string[]): The list of agent keys to be added.</li>
                              </ul>
                            </li>
                            <li className="leading-[1.05]"><b>Returns:</b> (number): The count of successfully added agents.</li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">addAccountRecord(_accountKey)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Adds an account record to the SpCoin smart contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_accountKey (string): The key of the account to be added.</li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">addAccountRecords(_accountListKeys)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Adds multiple account records to the SpCoin smart contract.</li>
                            <li className="leading-[1.05]">
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_accountListKeys (string[]): The list of account keys to be added.</li>
                              </ul>
                            </li>
                            <li className="leading-[1.05]"><b>Returns:</b> (number): The count of successfully added account records.</li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">addSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Adds a sponsorship transaction to the SpCoin smart contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_sponsorSigner (Object): The signer of the sponsoring account.</li>
                                <li className="leading-[1.05]">_recipientKey (string): The key of the sponsored recipient.</li>
                                <li className="leading-[1.05]">_recipientRateKey (string): The key representing the rate of the recipient.</li>
                                <li className="leading-[1.05]">_transactionQty (number): The quantity of the sponsorship transaction.</li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">addAgentSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Adds an agent sponsorship transaction to the SpCoin smart contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_sponsorSigner (Object): The signer of the sponsoring account.</li>
                                <li className="leading-[1.05]">_recipientKey (string): The key of the sponsored recipient.</li>
                                <li className="leading-[1.05]">_recipientRateKey (string): The key representing the rate of the recipient.</li>
                                <li className="leading-[1.05]">_accountAgentKey (string): The key of the sponsored agent.</li>
                                <li className="leading-[1.05]">_agentRateKey (string): The key representing the rate of the agent.</li>
                                <li className="leading-[1.05]">_transactionQty (number): The quantity of the agent sponsorship transaction.</li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">addBackDatedSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty, _transactionBackDate)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Adds a backdated sponsorship transaction to the SpCoin smart contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_sponsorSigner (Object): The signer of the sponsoring account.</li>
                                <li className="leading-[1.05]">_recipientKey (string): The key of the sponsored recipient.</li>
                                <li className="leading-[1.05]">_recipientRateKey (string): The key representing the rate of the recipient.</li>
                                <li className="leading-[1.05]">_transactionQty (number): The quantity of the backdated sponsorship transaction.</li>
                                <li className="leading-[1.05]">_transactionBackDate (number): The timestamp of the backdated sponsorship transaction.</li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">addBackDatedAgentSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty, _transactionBackDate)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Adds a backdated agent sponsorship transaction to the SpCoin smart contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_sponsorSigner (Object): The signer of the sponsoring account.</li>
                                <li className="leading-[1.05]">_recipientKey (string): The key of the sponsored recipient.</li>
                                <li className="leading-[1.05]">_recipientRateKey (string): The key representing the rate of the recipient.</li>
                                <li className="leading-[1.05]">_accountAgentKey (string): The key of the sponsored agent.</li>
                                <li className="leading-[1.05]">_agentRateKey (string): The key representing the rate of the agent.</li>
                                <li className="leading-[1.05]">_transactionQty (number): The quantity of the backdated agent sponsorship transaction.</li>
                                <li className="leading-[1.05]">_transactionBackDate (number): The timestamp of the backdated agent sponsorship transaction.</li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>
                    </ol>
                  )}
                </div>
              )}

              {/* SpCoinDeleteMethods (indented) */}
              <h2 className={`${h2Class} !mt-0 ml-5`} onClick={() => setShowDelete(!showDelete)}>
                SpCoinDeleteMethods {showDelete ? '▾' : '▸'}
              </h2>
              {showDelete && (
                <div className="ml-10">
                  <p ><b>Module Description:</b></p>
                  <p className="ml-[20px]">
                    This module exports the <b>SpCoinDeleteMethods</b> class, which provides methods for interacting with the SpCoin smart contract. It includes functionalities like deleting recipients, agents, account records, and sponsorships. This module also exports the SpCoinDeleteMethods for integration into other JavaScript programs.
                  </p>
                  <p><b>Properties:</b></p>
                  <ul className="list-disc list-inside ml-4">
                    <li><b>spCoinContractDeployed (Object):</b> The deployed instance of the SpCoin smart contract.</li>
                    <li><b>spCoinLogger (Object):</b> An instance of the SpCoinLogger class for logging purposes.</li>
                    <li><b>signer (Object):</b> The signer for the SpCoin smart contract.</li>
                  </ul>
                  <p><b>Constructor(_spCoinContractDeployed)</b></p>
                  <div className="ml-5">
                    <p><b>Description:</b></p>
                    <p>Creates an instance of SpCoinDeleteMethods and initializes properties.</p>
                    <p><b>Parameters:</b></p>
                    <ul className="list-disc list-inside ml-4">
                      <li>_spCoinContractDeployed (Object): The deployed instance of the SpCoin smart contract.</li>
                    </ul>
                  </div>

                  {/* Methods toggler */}
                  <p
                    className="!mt-0 mb-0 font-bold leading-[1.05] text-base inline-flex items-center cursor-pointer select-none"
                    onClick={() => setShowDeleteMethods(v => !v)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setShowDeleteMethods(v => !v);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={showDeleteMethods}
                  >
                    Methods <span className="ml-2 font-normal">{showDeleteMethods ? '▾' : '▸'}</span>
                  </p>

                  {showDeleteMethods && (
                    <ol className="list-decimal pl-8 ml-[0.5ch] marker:font-bold [&>li]:mb-[2px] mt-0.5">
                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">
                            setSigner(_signer)
                          </summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]">
                              <b>Description:</b> Sets the signer for the SponsorCoin contract.
                            </li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">
                                  _signer: The signer account to be set for the contract credential security access.
                                </li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">
                            unSponsorRecipient(_sponsorKey, _recipientKey)
                          </summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Un-sponsors a recipient from the SpCoin contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">sponsorKey: The key of the sponsor initiating the un-sponsorship.</li>
                                <li className="leading-[1.05]">recipientKey: The key of the recipient to be unsponsored.</li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details className="my-0">
                          <summary className="cursor-pointer leading-[1.05] font-bold">
                            deleteAgentRecord(_accountKey, _recipientKey, _accountAgentKey)
                          </summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Deletes an agent record from the SpCoin contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">accountKey: The key of the account associated with the agent.</li>
                                <li className="leading-[1.05]">recipientKey: The key of the recipient associated with the agent.</li>
                                <li className="leading-[1.05]">accountAgentKey: The key of the agent to be deleted.</li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>
                    </ol>
                  )}
                </div>
              )}

              {/* SpCoinStakingMethods (indented) */}
              <h2 className={`${h2Class} !mt-0 ml-5`} onClick={() => setShowStaking(!showStaking)}>
                SpCoinStakingMethods {showStaking ? '▾' : '▸'}
              </h2>
              {showStaking && (
                <div className="ml-10">
                  <p><b>Module Description:</b></p>
                  <p className="ml-[20px]">
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
                    <li>
                      <b>Constructor(_spCoinContractDeployed)</b>
                      <ul className="list-disc list-inside ml-4">
                        <li>
                          <b>Description:</b> Creates an instance of SpCoinStakingMethods and initializes properties.
                        </li>
                        <li>
                          <b>Parameters:</b>
                          <ul className="list-disc list-inside ml-6">
                            <li>
                              <code>_spCoinContractDeployed</code> (Object): The deployed instance of the SpCoin smart contract.
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>

                  {/* Methods toggler */}
                  <p
                    className="!mt-0 mb-0 font-bold leading-[1.05] text-base inline-flex items-center cursor-pointer select-none"
                    onClick={() => setShowStakingMethods(v => !v)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setShowStakingMethods(v => !v);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={showStakingMethods}
                  >
                    Methods <span className="ml-2 font-normal">{showStakingMethods ? '▾' : '▸'}</span>
                  </p>

                  {showStakingMethods && (
                    <div className="ml-5">
                      <ol className="list-decimal pl-8 ml-[0.5ch] marker:font-bold [&>li]:mb-[2px] mt-0.5">
                        <li>
                          <details className="my-0">
                            <summary className="cursor-pointer leading-[1.05] font-bold">1. setSigner(_signer)</summary>
                            <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                              <li className="leading-[1.05]"><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                              <li className="leading-[1.05]">
                                <b>Parameters:</b>
                                <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                  <li className="leading-[1.05]">_signer: The signer account to be set for the contract credential security access.</li>
                                </ul>
                              </li>
                            </ul>
                          </details>
                        </li>

                        <li>
                          <details className="my-0">
                            <summary className="cursor-pointer leading-[1.05] font-bold">2. testStakingRewards(lastUpdateTime, _testUpdateTime, _interestRate, _quantity)</summary>
                            <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                              <li className="leading-[1.05]"><b>Description:</b> Tests staking rewards by simulating a staking operation.</li>
                              <li className="leading-[1.05]">
                                <b>Parameters:</b>
                                <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                  <li className="leading-[1.05]">_lastUpdateTime: The last update time for staking rewards.</li>
                                  <li className="leading-[1.05]">_testUpdateTime: The simulated time for testing staking rewards.</li>
                                  <li className="leading-[1.05]">_interestRate: The interest rate for staking rewards.</li>
                                  <li className="leading-[1.05]">_quantity: The quantity to be staked.</li>
                                </ul>
                              </li>
                            </ul>
                          </details>
                        </li>

                        <li>
                          <details className="my-0">
                            <summary className="cursor-pointer leading-[1.05] font-bold">3. getStakingRewards(lastUpdateTime, _interestRate, _quantity)</summary>
                            <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                              <li className="leading-[1.05]"><b>Description:</b> Retrieves staking rewards for a specified account.</li>
                              <li className="leading-[1.05]">
                                <b>Parameters:</b>
                                <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                  <li className="leading-[1.05]">_lastUpdateTime: The last update time for staking rewards.</li>
                                  <li className="leading-[1.05]">_interestRate: The interest rate for staking rewards.</li>
                                  <li className="leading-[1.05]">_quantity: The quantity to be staked.</li>
                                </ul>
                              </li>
                            </ul>
                          </details>
                        </li>

                        <li>
                          <details className="my-0">
                            <summary className="cursor-pointer leading-[1.05] font-bold">4. getTimeMultiplier(_timeRateMultiplier)</summary>
                            <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                              <li className="leading-[1.05]"><b>Description:</b> Gets the time multiplier based on the provided time rate multiplier.</li>
                              <li className="leading-[1.05]">
                                <b>Parameters:</b>
                                <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                  <li className="leading-[1.05]">_timeRateMultiplier: The time rate multiplier.</li>
                                </ul>
                              </li>
                            </ul>
                          </details>
                        </li>

                        <li>
                          <details className="my-0">
                            <summary className="cursor-pointer leading-[1.05] font-bold">5. getAccountTimeInSecondeSinceUpdate(_tokenLastUpdate)</summary>
                            <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                              <li className="leading-[1.05]"><b>Description:</b> Retrieves the time elapsed in seconds since the last update for a specified account.</li>
                              <li className="leading-[1.05]">
                                <b>Parameters:</b>
                                <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                  <li className="leading-[1.05]">_tokenLastUpdate: The last update time for the account.</li>
                                </ul>
                              </li>
                            </ul>
                          </details>
                        </li>

                        <li>
                          <details className="my-0">
                            <summary className="cursor-pointer leading-[1.05] font-bold">6. getMillenniumTimeIntervalDivisor(_timeInSeconds)</summary>
                            <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                              <li className="leading-[1.05]"><b>Description:</b> Gets the annualized percentage for the provided time in seconds.</li>
                              <li className="leading-[1.05]">
                                <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                  <li className="leading-[1.05]">_timeInSeconds: The time interval in seconds.</li>
                                </ul>
                              </li>
                            </ul>
                          </details>
                        </li>

                        <li>
                          <details className="my-0">
                            <summary className="cursor-pointer leading-[1.05] font-bold">7. depositSponsorStakingRewards(_sponsorAccount, _recipientAccount, _recipientRate, _amount)</summary>
                            <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                              <li className="leading-[1.05]"><b>Description:</b> Deposits staking rewards for the sponsor account.</li>
                              <li className="leading-[1.05]">
                                <b>Parameters:</b>
                                <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                  <li className="leading-[1.05]">_sponsorAccount: The sponsor account.</li>
                                  <li className="leading-[1.05]">_recipientAccount: The recipient account.</li>
                                  <li className="leading-[1.05]">_recipientRate: The recipient rate.</li>
                                  <li className="leading-[1.05]">_amount: The amount to be staked.</li>
                                </ul>
                              </li>
                            </ul>
                          </details>
                        </li>

                        <li>
                          <details className="my-0">
                            <summary className="cursor-pointer leading-[1.05] font-bold">8. depositRecipientStakingRewards(_sponsorAccount, _recipientAccount, _recipientRate, _amount)</summary>
                            <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                              <li className="leading-[1.05]"><b>Description:</b> Deposits staking rewards for the recipient account.</li>
                              <li className="leading-[1.05]">
                                <b>Parameters:</b>
                                <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                  <li className="leading-[1.05]">_sponsorAccount: The sponsor account.</li>
                                  <li className="leading-[1.05]">_recipientAccount: The recipient account.</li>
                                  <li className="leading-[1.05]">_recipientRate: The recipient rate.</li>
                                  <li className="leading-[1.05]">_amount: The amount to be staked.</li>
                                </ul>
                              </li>
                            </ul>
                          </details>
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* SpCoinRewardsMethods (indented) */}
              <h2 className={`${h2Class} !mt-0 ml-5`} onClick={() => setShowRewards(!showRewards)}>
                SpCoinRewardsMethods {showRewards ? '▾' : '▸'}
              </h2>
              {showRewards && (
                <div className="ml-10">
                  <p><b>Module Description:</b></p>
                  <p className="ml-[20px]">
                    This class updates rewards for Sponsors, Agents, and Recipients based on a timing and reward allocation algorithm.
                  </p>

                  <div className="ml-5">
                    {/* Constructor */}
                    <p><b>Constructor(_spCoinContractDeployed)</b></p>
                    <ul className="list-disc list-inside ml-4">
                      <li><b>Description:</b> Creates an instance of SpCoinRewardsMethods and initializes properties.</li>
                      <li><b>Parameters:</b>
                        <ul className="list-disc list-inside ml-6">
                          <li>_spCoinContractDeployed (Object): The deployed instance of the SpCoin smart contract.</li>
                        </ul>
                      </li>
                    </ul>

                    {/* Methods toggler */}
                    <p
                      className="!mt-0 mb-0 font-bold leading-[1.05] text-base inline-flex items-center cursor-pointer select-none"
                      onClick={() => setShowRewardsMethods(v => !v)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setShowRewardsMethods(v => !v);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={showRewardsMethods}
                    >
                      Methods <span className="ml-2 font-normal">{showRewardsMethods ? '▾' : '▸'}</span>
                    </p>

                    {showRewardsMethods && (
                      <ol className="list-decimal pl-8 ml-[0.5ch] marker:font-bold [&>li]:mb-[2px] mt-0.5">
                        <li>
                          <details className="my-0">
                            <summary className="cursor-pointer leading-[1.05] font-bold">1. setSigner(_signer)</summary>
                            <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                              <li className="leading-[1.05]"><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                              <li className="leading-[1.05]">
                                <b>Parameters:</b>
                                <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                  <li className="leading-[1.05]">_signer: The signer account to be set for the contract credential security access.</li>
                                </ul>
                              </li>
                            </ul>
                          </details>
                        </li>

                        <li>
                          <details className="my-0">
                            <summary className="cursor-pointer leading-[1.05] font-bold">2. updateAccountStakingRewards(_accountKey)</summary>
                            <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                              <li className="leading-[1.05]"><b>Description:</b> Updates staking rewards for a specified account.</li>
                              <li className="leading-[1.05]">
                                <b>Parameters:</b>
                                <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                  <li className="leading-[1.05]">_accountKey: Account for which the rewards are to be updated.</li>
                                </ul>
                              </li>
                            </ul>
                          </details>
                        </li>
                      </ol>
                    )}

                    <p className="mt-2"><b>Exporting the Module:</b> The module exports an object with a single property <code>SpCoinRewardsMethods</code> which holds the class.</p>
                  </div>
                </div>
              )}

              {/* SpCoinReadMethods (indented) */}
              <h2 className={`${h2Class} !mt-0 ml-5`} onClick={() => setShowRead(!showRead)}>
                SpCoinReadMethods {showRead ? '▾' : '▸'}
              </h2>
              {showRead && (
                <div className="ml-10">
                  <p><b>Module Description:</b></p>
                  <p className="ml-[20px]">
                    This class provides read methods to interact with a SpCoin contract. It has methods to retrieve information about accounts, recipients, agents, and reward-related data.
                  </p>
                  <p><b>Constructor(_spCoinContractDeployed)</b></p>
                  <div className="ml-5">
                    <p><b>Description:</b> Creates an instance of SpCoinReadMethods and initializes properties.</p>
                    <p><b>Parameters:</b></p>
                    <ul className="list-disc list-inside ml-4">
                      <li>_spCoinContractDeployed (Object): The deployed instance of the SpCoin smart contract.</li>
                    </ul>
                  </div>

                  {/* Methods toggler */}
                  <p
                    className="!mt-0 mb-0 font-bold leading-[1.05] text-base inline-flex items-center cursor-pointer select-none"
                    onClick={() => setShowReadMethods(v => !v)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setShowReadMethods(v => !v);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={showReadMethods}
                  >
                    Methods <span className="ml-2 font-normal">{showReadMethods ? '▾' : '▸'}</span>
                  </p>

                  {showReadMethods && (
                    <ol className="list-decimal pl-8 ml-[0.5ch] marker:font-bold [&>li]:mb-[2px] mt-0.5">
                      <li>
                        <details>
                          <summary className="cursor-pointer leading-[1.05] font-bold">1. setSigner(_signer)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_signer: The signer account to be set for the contract credential security access.</li>
                              </ul>
                            </li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details>
                          <summary className="cursor-pointer leading-[1.05] font-bold">2. getAccountList()</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Get a list of all account keys.</li>
                            <li className="leading-[1.05]"><b>Returns:</b> Promise containing the list of account keys.</li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details>
                          <summary className="cursor-pointer leading-[1.05] font-bold">3. getAccountListSize()</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Get the size of the account list.</li>
                            <li className="leading-[1.05]"><b>Returns:</b> Promise containing the size of the account list.</li>
                          </ul>
                        </details>
                      </li>

                      <li>
                        <details>
                          <summary className="cursor-pointer leading-[1.05] font-bold">4. getAccountRecipientList(_accountKey)</summary>
                          <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                            <li className="leading-[1.05]"><b>Description:</b> Get the list of recipients for a given account key.</li>
                            <li className="leading-[1.05]">
                              <b>Parameters:</b>
                              <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                                <li className="leading-[1.05]">_accountKey: Key of the account.</li>
                              </ul>
                            </li>
                            <li className="leading-[1.05]"><b>Returns:</b> Promise containing the list of recipient account keys.</li>
                          </ul>
                        </details>
                      </li>

                      {/* ...rest of Read methods unchanged... */}
                    </ol>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
