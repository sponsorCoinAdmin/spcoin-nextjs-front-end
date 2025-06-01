'use client';

import React, { useState } from 'react';

const h2Class = 'mt-4 text-[20px] font-bold cursor-pointer';

export default function SpCoinDeleteMethodsPage() {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <main className="min-h-screen bg-white p-8" style={{ color: '#000' }}>
      <div className="text-center mb-10">
        <h1 className="text-[30px] font-bold">SpCoinDeleteMethods</h1>
      </div>

      <div style={{ marginLeft: '45px', marginRight: '45px' }}>
        <h2 className={h2Class} onClick={() => setShowDelete(!showDelete)}>
          Module Description {showDelete ? '▾' : '▸'}
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
              <li><b>setSigner(_signer)</b>
                <ul className="list-disc list-inside ml-4">
                  <li><b>Description:</b> Sets the signer for the SponsorCoin contract.</li>
                  <li><b>Parameters:</b> _signer: The signer to be set for the contract.</li>
                </ul>
              </li>
              <li>
                <p><b>deleteAccountRecord(_accountKey)</b></p>
                <ul className="list-disc list-inside ml-4">
                  <li><b>Description:</b> Deletes an account record from the SpCoin contract.</li>
                  <li><b>Parameters:</b> accountKey: The key of the account to be deleted.</li>
                </ul>
              </li>
              <li>
                <p><b>deleteAccountRecords(accountListKeys)</b></p>
                <ul className="list-disc list-inside ml-4">
                  <li><b>Description:</b> Deletes multiple account records from the SpCoin contract.</li>
                  <li><b>Parameters:</b> _accountListKeys: The list of account keys to be deleted.</li>
                </ul>
              </li>
              <li>
                <p><b>unSponsorRecipient(_sponsorKey, _recipientKey)</b></p>
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
                <p><b>deleteAgentRecord(_accountKey, _recipientKey, _accountAgentKey)</b></p>
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
      </div>
    </main>
  );
}
