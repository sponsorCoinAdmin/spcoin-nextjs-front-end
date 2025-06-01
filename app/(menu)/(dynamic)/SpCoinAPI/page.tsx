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
              <div style={{ marginLeft: '20px' }}>
                <p><b>Constructor(_spCoinContractDeployed)</b></p>
                <ol className="list-decimal list-inside">
                  <li>setSigner (_signer)</li>
                  <li>AddRecipient (_recipientKey)</li>
                  <li>addRecipients (_accountKey, _recipientAccount)</li>
                  <li>addAgent (_recipientKey, _recipientRateKey, _accountAgentList)</li>
                  <li>addAgents (_recipientKey, _recipientRateKey, _agentAccountList)</li>
                  <li>addAccountRecord (_accountKey)</li>
                  <li>addAccountRecords (_accountListKeys)</li>
                  <li>addSponsorship (_sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty)</li>
                  <li>addAgentSponsorship (_sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty)</li>
                  <li>addBackDatedSponsorship (_sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty, _transactionBackDate)</li>
                  <li>addBackDatedAgentSponsorship (_sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty, _transactionBackDate)</li>
                </ol>
              </div>
            </div>
          )}

          <h2 className={h2Class} onClick={() => setShowDelete(!showDelete)}>
            SpCoinDeleteMethods {showDelete ? '▾' : '▸'}
          </h2>
          {showDelete && (
            <div style={{ marginLeft: '20px' }}>
              <p><b>Module Description:</b></p>
              <div style={{ marginLeft: '20px' }}>
                <p><b>Constructor(_spCoinContractDeployed)</b></p>
                <ol className="list-decimal list-inside">
                  <li>setSigner(_signer)</li>
                  <li>deleteAccountRecord(_accountKey)</li>
                  <li>deleteAccountRecords(accountListKeys)</li>
                  <li>unSponsorRecipient(_sponsorKey, _recipientKey)</li>
                  <li>deleteAgentRecord (_accountKey, _recipientKey, _accountAgentKey)</li>
                </ol>
              </div>
            </div>
          )}

          <h2 className={h2Class} onClick={() => setShowStaking(!showStaking)}>
            SpCoinStakingMethods {showStaking ? '▾' : '▸'}
          </h2>
          {showStaking && (
            <div style={{ marginLeft: '20px' }}>
              <p><b>Module Description:</b></p>
              <div style={{ marginLeft: '20px' }}>
                <p><b>Constructor(_spCoinContractDeployed)</b></p>
                <ol className="list-decimal list-inside">
                  <li>setSigner(_signer)</li>
                  <li>testStakingRewards (lastUpdateTime, _testUpdateTime, _interestRate, _quantity)</li>
                  <li>getStakingRewards (lastUpdateTime, _interestRate, _quantity)</li>
                  <li>getTimeMultiplier ( _timeRateMultiplier )</li>
                  <li>getAccountTimeInSecondeSinceUpdate ( _tokenLastUpdate )</li>
                  <li>getMillenniumTimeIntervalDivisor ( _timeInSeconds )</li>
                  <li>depositSponsorStakingRewards ( _sponsorAccount, _recipientAccount, _recipientRate, _amount )</li>
                  <li>depositRecipientStakingRewards ( _sponsorAccount, _recipientAccount, _recipientRate, _amount )</li>
                  <li>depositAgentStakingRewards ( _sponsorAccount, _recipientAccount, _recipientRate, _agentAccount, _agentRate, _amount )</li>
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
              <p><b>Module Description:</b></p>
              <div style={{ marginLeft: '20px' }}>
                <p><b>Constructor(_spCoinContractDeployed)</b></p>
                <ol className="list-decimal list-inside">
                  <li>setSigner(_signer)</li>
                  <li>getAccountList()</li>
                  <li>getAccountListSize()</li>
                  <li>getAccountRecipientList(_accountKey)</li>
                  <li>getAccountRecipientListSize(_accountKey)</li>
                  <li>getAccountRecord(_accountKey)</li>
                  <li>getAccountStakingRewards(_accountKey)</li>
                  <li>getRewardTypeRecord(_accountKey, _rewardType, _reward)</li>
                  <li>getAccountRewardTransactionList(_rewardAccountList)</li>
                  <li>getAccountRewardTransactionRecord(_rewardRecordStr)</li>
                  <li>getAccountRateRecordList(rateRewardList)</li>
                  <li>getRateTransactionList(rewardRateRowList)</li>
                  <li>getSPCoinHeaderRecord(getBody)</li>
                  <li>getAccountRecords()</li>
                  <li>getAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getAgentRateRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</li>
                  <li>getAgentRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getAgentRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getAgentRateTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</li>
                  <li>getAgentTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRecipientRateTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</li>
                  <li>getRecipientTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getSponsorRecipientTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRecipientRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRecipientRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRecipientRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRecipientRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRecipientRateRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _recipientRate)</li>
                  <li>getRecipientRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRewardRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getSponsorRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getSponsorRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRewardTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRewardTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRewardRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRewardTypeRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getRecipientRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getAgentRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                  <li>getSponsorRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
