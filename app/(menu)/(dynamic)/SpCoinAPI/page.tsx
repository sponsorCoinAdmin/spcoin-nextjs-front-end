// File: app/(menu)/(dynamic)/SpCoinAPI/page.tsx
'use client';

import React, { useState } from 'react';

const h2Class = 'mt-4 text-[20px] font-bold cursor-pointer';
const disclosure = (open: boolean) => (open ? 'v' : '>');

type ApiMethod = {
  name: string;
  description: string;
  parameters?: string[];
  returns?: string;
};

type ApiModule = {
  name: string;
  legacyName?: string;
  description: string;
  properties: string[];
  methods: ApiMethod[];
};

const moduleSections: ApiModule[] = [
  {
    name: 'SpCoinERC20Module',
    legacyName: 'spCoinERC20Methods',
    description:
      'Contains standard ERC20 token access exposed alongside the SponsorCoin-specific modules. SponsorCoinLab ERC20 read/write panels delegate to this module so the ERC20 access code has one source of truth.',
    properties: ['spCoinContractDeployed', 'spCoinLogger'],
    methods: [
      { name: 'name()', description: 'Reads the ERC20 token name.' },
      { name: 'symbol()', description: 'Reads the ERC20 token symbol.' },
      { name: 'decimals()', description: 'Reads the ERC20 token decimal precision.' },
      { name: 'totalSupply()', description: 'Reads the total ERC20 token supply.' },
      { name: 'balanceOf(owner)', description: 'Reads the ERC20 token balance for an owner address.' },
      { name: 'allowance(owner, spender)', description: 'Reads the approved ERC20 allowance from owner to spender.' },
      { name: 'transfer(to, amount)', description: 'Transfers SponsorCoin tokens through the standard ERC20 contract path.' },
      { name: 'approve(spender, amount)', description: 'Approves a spender to use tokens from the connected account.' },
      { name: 'transferFrom(from, to, amount)', description: 'Transfers tokens from one account to another using an existing allowance.' },
      { name: 'signerTransfer(_signer, _recipientKey, _transactionQty)', description: 'Package helper that transfers SponsorCoin tokens using an explicit signer.' },
    ],
  },
  {
    name: 'SpCoinReadModule',
    legacyName: 'spCoinReadMethods',
    description:
      'Reads account, relationship, role, metadata, rate, transaction, and reward information. It also includes cache-aware account tree reads and off-chain reward estimates.',
    properties: ['spCoinContractDeployed', 'spCoinSerialize', 'spCoinLogger'],
    methods: [
      { name: 'getMasterAccountMetaData()', description: 'Reads metadata for the master account list.' },
      { name: 'getAccountKeys() / getMasterAccountKeys() / getMasterAccountList()', description: 'Reads all account keys.' },
      { name: 'getAccountListSize() / getMasterAccountCount()', description: 'Reads the master account count.' },
      { name: 'getActiveAccountKeys() / getActiveAccountList()', description: 'Reads active account keys.' },
      { name: 'getActiveAccountCount() / getActiveAccountListSize()', description: 'Reads the active account count.' },
      { name: 'getActiveAccountKeyAt(index) / getActiveAccountElement(index)', description: 'Reads one active account key by index.' },
      { name: 'getSponsorKeys(accountKey?)', description: 'Reads sponsor keys for an account or sponsor index context.' },
      { name: 'getRecipientKeys(_accountKey) / getAccountRecipientList(_accountKey)', description: 'Reads recipient keys for an account.' },
      { name: 'getAccountRecipientListSize(_accountKey)', description: 'Reads recipient count for an account.' },
      { name: 'getAccountRecord(_accountKey, options?)', description: 'Reads the full account tree record, including relationships and nested transaction data.' },
      { name: 'getAccountRecordShallow(_accountKey, options?)', description: 'Reads a lighter account record without full tree expansion.' },
      { name: 'getAccountRecordBase(_accountKey, options?)', description: 'Reads the account base fields used by tree and reward calculations.' },
      { name: 'getAccountRoleSummary(_accountKey)', description: 'Reads sponsor, recipient, and agent role status.' },
      { name: 'getRoles(_accountKey)', description: 'Reads the account role bitmask: 0 = N/A, 1 = Sponsor, 2 = Recipient, 4 = Agent.' },
      { name: 'getAccountRoles(_accountKey)', description: 'Compatibility alias for getRoles(_accountKey).' },
      { name: 'isSponsor(_accountKey) / isRecipient(_accountKey) / isAgent(_accountKey)', description: 'Reads individual role flags.' },
      { name: 'getAccountLinks(accountKey)', description: 'Reads sponsor, recipient, agent, and parent-recipient links.' },
      { name: 'getAccountStakingRewards(_accountKey)', description: 'Reads the current on-chain staking rewards struct for an account.' },
      { name: 'estimateOffChainTotalRewards(_accountKey, options?)', description: 'Estimates total rewards without writing to the contract.' },
      { name: 'estimateOffChainSponsorRewards(_accountKey, options?)', description: 'Estimates sponsor rewards without writing to the contract.' },
      { name: 'estimateOffChainRecipientRewards(_accountKey, options?)', description: 'Estimates recipient rewards without writing to the contract.' },
      { name: 'estimateOffChainAgentRewards(_accountKey, options?)', description: 'Estimates agent rewards without writing to the contract.' },
      { name: 'calculateClaimedRewards(accountKey, optionsOrTimestampOverride?, timestampOverride?)', description: 'Calculates claimed reward values using the read module runtime.' },
      { name: 'getSpCoinMetaData()', description: 'Reads contract-level SponsorCoin metadata.' },
      { name: 'getInflationRate(options?)', description: 'Reads the configured inflation rate.' },
      { name: 'getRecipient(_sponsorKey, _recipientKey)', description: 'Reads one recipient relationship record.' },
      { name: 'getRecipientRecordList(_sponsorKey, _recipientAccountList)', description: 'Reads recipient records for a sponsor.' },
      { name: 'getRecipientRateKeys(_sponsorKey, _recipientKey) / getRecipientRateList(_sponsorKey, _recipientKey)', description: 'Reads recipient rate keys.' },
      { name: 'getSponsorRecipientRates(_sponsorKey, _recipientKey)', description: 'Reads sponsor-recipient rate keys through the compatibility alias.' },
      { name: 'getRecipientRateRange()', description: 'Reads the allowed recipient rate range.' },
      { name: 'getRecipientTransaction(_sponsorKey, _recipientKey, _recipientRateKey)', description: 'Reads one recipient rate transaction.' },
      { name: 'getRecipientTransactionList(_sponsorKey, _recipientKey)', description: 'Reads recipient transactions for a sponsor-recipient relationship.' },
      { name: 'getRecipientTransactionEntries(_sponsorKey, _recipientKey, _recipientRateKey)', description: 'Reads recipient transaction entries for a rate.' },
      { name: 'getRecipientTransactionIdKeys(_sponsorKey, _recipientKey, _recipientRateKey)', description: 'Reads recipient transaction id keys.' },
      { name: 'getRecipientRateTransactionSetKey(_sponsorKey, _recipientKey, _recipientRateKey)', description: 'Reads the transaction set key for a recipient rate.' },
      { name: 'getRecipientRateAgentKeys(_sponsorKey, _recipientKey, _recipientRateKey)', description: 'Reads agent keys attached to a recipient rate.' },
      { name: 'getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey)', description: 'Reads agent list entries attached to a recipient rate.' },
      { name: 'getAgent(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)', description: 'Reads one agent relationship record.' },
      { name: 'getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentAccountList)', description: 'Reads agent records for a recipient rate.' },
      { name: 'getAgentRateKeys(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)', description: 'Reads agent rate keys.' },
      { name: 'getAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)', description: 'Reads agent rate list entries.' },
      { name: 'getAgentRateRange()', description: 'Reads the allowed agent rate range.' },
      { name: 'getAgentTransaction(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)', description: 'Reads one agent rate transaction.' },
      { name: 'getAgentTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)', description: 'Reads agent transactions for a recipient-agent relationship.' },
      { name: 'getAgentTransactionEntries(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)', description: 'Reads agent transaction entries for a rate.' },
      { name: 'getAgentTransactionIdKeys(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)', description: 'Reads agent transaction id keys.' },
      { name: 'getAgentRateTransactionSetKey(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)', description: 'Reads the transaction set key for an agent rate.' },
      { name: 'getAgentSponsorKeys(agentKey)', description: 'Reads sponsor keys linked to an agent.' },
      { name: 'getAgentSponsorAgentRateTransactionSetKeys(agentKey, sponsorKey)', description: 'Reads agent rate transaction set keys by agent and sponsor.' },
      { name: 'getRateTransactionSet(setKey)', description: 'Reads one rate transaction set.' },
      { name: 'getTransactionRecord(transactionId)', description: 'Reads one transaction record by id.' },
    ],
  },
  {
    name: 'SpCoinWriteModule',
    legacyName: 'spCoinAddMethods / spCoinDeleteMethods / spCoinRewardsMethods / spCoinStakingMethods',
    description:
      'Groups public SponsorCoin write operations. It is a facade over the existing add, delete, rewards, and staking modules so the Script Editor SpCoin Write group and API documentation share one public concept.',
    properties: ['spCoinContractDeployed', 'add', 'delete', 'rewards', 'staking'],
    methods: [
      { name: 'addAccountRecord(_accountKey)', description: 'Adds one account record to the SponsorCoin contract.' },
      { name: 'addAccountRecords(_accountListKeys)', description: 'Adds multiple account records.' },
      { name: 'addSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _transactionQty)', description: 'Adds a recipient sponsorship transaction.' },
      { name: 'addAgentSponsorship(_sponsorSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty)', description: 'Adds an agent sponsorship transaction.' },
      { name: 'addRecipientTransaction(_recipientKey, _recipientRateKey, _transactionQty)', description: 'Adds a recipient transaction for the connected sponsor.' },
      { name: 'addRecipientRateTransaction(_recipientKey, _recipientRateKey, _transactionQty)', description: 'Adds a recipient rate transaction.' },
      { name: 'addAgentTransaction(_recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty)', description: 'Adds an agent transaction for a recipient rate.' },
      { name: 'addAgentRateTransaction(_recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty)', description: 'Adds an agent rate transaction.' },
      { name: 'unSponsorRecipient(_sponsorKey, _recipientKey)', description: 'Unsponsors a recipient from a sponsor account.' },
      { name: 'deleteAccountRecord(_accountKey)', description: 'Deletes one account record.' },
      { name: 'deleteAccountRecords(_accountListKeys)', description: 'Deletes multiple account records.' },
      { name: 'deleteAgentRecord(_accountKey, _recipientKey, _accountAgentKey)', description: 'Deletes an agent record from a recipient relationship.' },
      { name: 'claimOnChainTotalRewards(_accountKey)', description: 'Claims all available on-chain rewards for an account.' },
      { name: 'claimOnChainSponsorRewards(_accountKey)', description: 'Claims sponsor rewards for an account.' },
      { name: 'claimOnChainRecipientRewards(_accountKey)', description: 'Claims recipient rewards for an account.' },
      { name: 'claimOnChainAgentRewards(_accountKey)', description: 'Claims agent rewards for an account.' },
      { name: 'depositSponsorStakingRewards(_accountKey)', description: 'Deposits sponsor staking rewards.' },
      { name: 'depositRecipientStakingRewards(_accountKey)', description: 'Deposits recipient staking rewards.' },
      { name: 'depositAgentStakingRewards(_accountKey)', description: 'Deposits agent staking rewards.' },
    ],
  },
  {
    name: 'SpCoinAdminModule',
    legacyName: 'Admin Utils',
    description:
      'Groups privileged or administrative SponsorCoin operations. These are on-chain writes, even when legacy compatibility wrappers still expose some names through the off-chain processor.',
    properties: ['spCoinContractDeployed', 'spCoinLogger'],
    methods: [
      { name: 'setLowerRecipientRate(newLowerRecipientRate)', description: 'Updates the lower recipient rate while preserving the current upper range.' },
      { name: 'setUpperRecipientRate(newUpperRecipientRate)', description: 'Updates the upper recipient rate while preserving the current lower range.' },
      { name: 'setLowerAgentRate(newLowerAgentRate)', description: 'Updates the lower agent rate while preserving the current upper range.' },
      { name: 'setUpperAgentRate(newUpperAgentRate)', description: 'Updates the upper agent rate while preserving the current lower range.' },
      { name: 'addBackDatedSponsorship(_adminSigner, _recipientKey, _recipientRateKey, _transactionQty, _transactionBackDate)', description: 'Adds a backdated recipient sponsorship transaction.' },
      { name: 'addBackDatedAgentSponsorship(_adminSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty, _transactionBackDate)', description: 'Adds a backdated agent sponsorship transaction.' },
      { name: 'addBackDatedRecipientTransaction(_adminSigner, _recipientKey, _recipientRateKey, _transactionQty, _transactionBackDate)', description: 'Adds a backdated recipient transaction.' },
      { name: 'addBackDatedAgentTransaction(_adminSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionQty, _transactionBackDate)', description: 'Adds a backdated agent transaction.' },
      { name: 'backDateRecipientTransaction(_adminSigner, _recipientKey, _recipientRateKey, _transactionIndex, _transactionBackDate)', description: 'Updates a recipient transaction timestamp for testing or recovery.' },
      { name: 'backDateAgentTransaction(_adminSigner, _recipientKey, _recipientRateKey, _accountAgentKey, _agentRateKey, _transactionIndex, _transactionBackDate)', description: 'Updates an agent transaction timestamp for testing or recovery.' },
    ],
  },
  {
    name: 'SpCoinUtilModule',
    legacyName: 'Utility helpers',
    description:
      'Groups shared non-contract helpers used by the access layer and development tools.',
    properties: ['logger', 'serialize', 'dateTime', 'dataTypes', 'printTreeStructures'],
    methods: [
      { name: 'logger', description: 'SpCoinLogger instance for access-module logging.' },
      { name: 'serialize', description: 'SpCoinSerialize instance for account and tree serialization.' },
      { name: 'dateTime', description: 'Date and time helper functions.' },
      { name: 'dataTypes', description: 'SponsorCoin data type constructors and structs.' },
      { name: 'printTreeStructures', description: 'Tree formatting and print helpers.' },
    ],
  },
];

const offChainMethods: ApiMethod[] = [
  { name: 'deleteAccountTree()', description: 'Walks and deletes the connected signer account tree using on-chain read and delete modules.' },
];

function MethodList({ methods }: { methods: ApiMethod[] }) {
  return (
    <ol className="list-decimal pl-8 ml-[0.5ch] marker:font-bold [&>li]:mb-[2px] mt-0.5">
      {methods.map((method) => (
        <li key={method.name}>
          <details className="my-0">
            <summary className="cursor-pointer leading-[1.05] font-bold">{method.name}</summary>
            <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
              <li className="leading-[1.05]">
                <b>Description:</b> {method.description}
              </li>
              {method.parameters?.length ? (
                <li className="leading-[1.05]">
                  <b>Parameters:</b>
                  <ul className="list-disc pl-7 ml-[0.5ch] mt-0.5">
                    {method.parameters.map((parameter) => (
                      <li className="leading-[1.05]" key={parameter}>
                        {parameter}
                      </li>
                    ))}
                  </ul>
                </li>
              ) : null}
              {method.returns ? (
                <li className="leading-[1.05]">
                  <b>Returns:</b> {method.returns}
                </li>
              ) : null}
            </ul>
          </details>
        </li>
      ))}
    </ol>
  );
}

function ApiModuleSection({ module }: { module: ApiModule }) {
  const [showModule, setShowModule] = useState(false);
  const [showMethods, setShowMethods] = useState(false);

  return (
    <>
      <h2
        className={`${h2Class} !mt-0 ml-5`}
        onClick={() => setShowModule((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setShowModule((value) => !value);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={showModule}
      >
        {module.name} {disclosure(showModule)}
      </h2>
      {showModule && (
        <div className="ml-10">
          <p>
            <b>Module Description:</b>
          </p>
          <p className="ml-[20px]">{module.description}</p>
          {module.legacyName ? (
            <p className="ml-[20px]">
              <b>Legacy access name:</b> <code>{module.legacyName}</code>
            </p>
          ) : null}
          <p>
            <b>Properties:</b>
          </p>
          <ul className="list-disc list-inside ml-4">
            {module.properties.map((property) => (
              <li key={property}>
                <b>{property}</b>
              </li>
            ))}
          </ul>
          <p>
            <b>Constructor(_spCoinContractDeployed)</b>
          </p>
          <ul className="list-disc list-inside ml-4">
            <li>
              <b>Description:</b> Creates an instance of {module.name} and binds the module method functions.
            </li>
            <li>
              <b>Parameters:</b> _spCoinContractDeployed: The deployed SponsorCoin smart contract instance.
            </li>
          </ul>
          <p
            className="!mt-0 mb-0 font-bold leading-[1.05] text-base inline-flex items-center cursor-pointer select-none"
            onClick={() => setShowMethods((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setShowMethods((value) => !value);
              }
            }}
            tabIndex={0}
            role="button"
            aria-expanded={showMethods}
          >
            Methods <span className="ml-2 font-normal">{disclosure(showMethods)}</span>
          </p>
          {showMethods && <MethodList methods={module.methods} />}
        </div>
      )}
    </>
  );
}

export default function WhitePaper() {
  const [showOverview, setShowOverview] = useState(false);
  const [showLibraries, setShowLibraries] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [showOffChain, setShowOffChain] = useState(false);
  const [showOffChainMethods, setShowOffChainMethods] = useState(false);

  return (
    <main className="prose prose-slate max-w-none p-8 bg-white min-h-screen text-[#000]">
      <div className="flex flex-col lg:flex-row items-start justify-center gap-10">
        <div className="flex flex-col items-center max-w-full lg:max-w-[600px]">
          <img
            src="/docs/spCoinAPI/spCoinLogo.png"
            alt="spCoin Logo"
            className="w-full max-w-[600px] h-auto mb-4"
          />
          <h2 className="mt-4 text-[24px] font-bold text-[#f87171]">SponsorCoin</h2>
          <h2 className="mt-4 text-[20px] font-bold">A JavaScript Node API Access Library</h2>
        </div>
        <div className="hidden lg:block self-stretch w-[2px] bg-[#f87171]" aria-hidden="true" />
        <div className="text-base leading-7 lg:max-w-[600px] px-4">
          <span className="!text-[#f87171] text-xl font-bold">SPONSOR COIN API&apos;S:</span>
          <br />
          The SponsorCoin protocol proposes a solution where the free-market economy can donate SponsorCoin crypto coins to their cause with no cost of any kind from the sponsor&apos;s portfolio. The SponsorCoin owner maintains complete custody of any SponsorCoins obtained. The owner of the coin may generate staking rewards by identifying a sponsored beneficiary as a worthwhile cause and assigning the beneficiary&apos;s Ethereum address to share in the staking rewards. The coin owner/sponsor never relinquishes any of the SponsorCoin investment but instead shares the proof of stake rewards with the chosen charity. This donation is an ongoing sponsorship implementation utilizing proof of stake, and is only revoked when the coins are unsponsored or the sponsor reallocates the coins to a new sponsor. All SponsorCoin transactions and relationships are recorded on the SponsorCoin network and are immutable. SponsorCoins are considered staked only if a beneficiary is assigned to the coins by the owner.
          <br />
          <br />
          <div className="text-[20px] font-bold text-[#f87171]">Robert Lanson</div>
          <b>Author and Technical Architect</b>
        </div>
      </div>

      <div className="mt-10 px-4 lg:px-0">
        <div className="text-center mb-10">
          <h1 className="text-[30px] font-bold">Contents</h1>
        </div>

        <div className="mx-[45px]">
          <h2
            className={`${h2Class} !text-[24px] font-bold !text-[#f87171]`}
            onClick={() => setShowOverview((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setShowOverview((value) => !value);
              }
            }}
            tabIndex={0}
            role="button"
            aria-expanded={showOverview}
          >
            Sponsor Coin API Access Library Overview {showOverview ? '▾' : '▸'}
          </h2>

          {showOverview && (
            <div className="ml-5 mt-2">
              <p>
                <b>NPM Module Description:</b> This document details the TypeScript and JavaScript class modules available to the ERC20 SponsorCoin token contract. These access modules interact with the SponsorCoin contract on the ERC20 based network and manage Sponsor Coin accounts, sponsorship relationships, reward claims, staking calculations, and ERC20 token method calls.
              </p>
              <p>
                <b>NPM Installation:</b> This project requires Node 18.16.0 or later. You can install it using the following command:{' '}
                <span className="font-bold text-blue-600 underline">npm i @sponsorcoin/spcoin-access-modules</span>
              </p>
              <p>
                The current access package exposes a top-level <b>SpCoinAccessModules</b> facade. This is a <b>SpCoinOnChainProcessor</b> for direct contract modules, and an <b>SpCoinOffChainProcessor</b> for higher-level orchestration workflows.
              </p>
            </div>
          )}

          <h2
            className={`${h2Class} !text-[24px] font-bold !text-[#f87171]`}
            onClick={() => setShowArchitecture((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setShowArchitecture((value) => !value);
              }
            }}
            tabIndex={0}
            role="button"
            aria-expanded={showArchitecture}
          >
            Sponsor Coin Access Architecture <span className="ml-2">{showArchitecture ? '▾' : '▸'}</span>
          </h2>
          {showArchitecture && (
            <div className="ml-5 mt-2">
              <p>
                <b>SpCoinAccessModules:</b>
              </p>
              <p className="ml-[20px]">
                The top-level compatibility facade exposes the deployed contract, logger, on-chain processor, off-chain processor, public grouped modules, and legacy names such as <code>spCoinAddMethods</code> and <code>spCoinReadMethods</code>.
              </p>
              <p>
                <b>SpCoinOnChainProcessor:</b>
              </p>
              <p className="ml-[20px]">
                Creates the deployed ethers contract instance and groups direct contract modules under short names: <code>erc20</code>, <code>read</code>, <code>write</code>, <code>admin</code>, and <code>util</code>. Legacy short names such as <code>add</code>, <code>delete</code>, <code>rewards</code>, and <code>staking</code> remain available for compatibility.
              </p>
              <p>
                <b>SpCoinOffChainProcessor:</b>
              </p>
              <p className="ml-[20px]">
                Coordinates higher-level workflows that use on-chain modules underneath, such as tree deletion.
              </p>
            </div>
          )}

          <h2
            className={`${h2Class} !text-[24px] font-bold !text-[#f87171]`}
            onClick={() => setShowLibraries((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setShowLibraries((value) => !value);
              }
            }}
            tabIndex={0}
            role="button"
            aria-expanded={showLibraries}
          >
            Sponsor Coin API Access Libraries <span className="ml-2">{showLibraries ? '▾' : '▸'}</span>
          </h2>

          {showLibraries && (
            <>
              {moduleSections.map((module) => (
                <ApiModuleSection key={module.name} module={module} />
              ))}

              <h2
                className={`${h2Class} !mt-0 ml-5`}
                onClick={() => setShowOffChain((value) => !value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setShowOffChain((value) => !value);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-expanded={showOffChain}
              >
                Off-Chain Workflows {disclosure(showOffChain)}
              </h2>
              {showOffChain && (
                <div className="ml-10">
                  <p>
                    <b>Workflow Description:</b>
                  </p>
                  <p className="ml-[20px]">
                    These methods are exposed by <code>SpCoinOffChainProcessor</code>. They coordinate multi-step workflows that use on-chain modules underneath. Single on-chain admin writes, such as rate-range updates, are documented under <code>SpCoinAdminModule</code>.
                  </p>
                  <p
                    className="!mt-0 mb-0 font-bold leading-[1.05] text-base inline-flex items-center cursor-pointer select-none"
                    onClick={() => setShowOffChainMethods((value) => !value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setShowOffChainMethods((value) => !value);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={showOffChainMethods}
                  >
                    Methods <span className="ml-2 font-normal">{disclosure(showOffChainMethods)}</span>
                  </p>
                  {showOffChainMethods && <MethodList methods={offChainMethods} />}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
