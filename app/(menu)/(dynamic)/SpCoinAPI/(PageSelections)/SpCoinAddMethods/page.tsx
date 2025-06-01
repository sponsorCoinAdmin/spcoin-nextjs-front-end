'use client';

import React, { useState } from 'react';

const h2Class = 'mt-4 text-[20px] font-bold cursor-pointer';

export default function SpCoinAddMethodsPage() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <main className="min-h-screen bg-white p-8" style={{ color: '#000' }}>
      <div className="text-center mb-10">
        <h1 className="text-[30px] font-bold">SpCoinAddMethods</h1>
      </div>

      <div style={{ marginLeft: '45px', marginRight: '45px' }}>
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
      </div>
    </main>
  );
}
