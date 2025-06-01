// File: app/(menu)/SpCoinRewardsMethods.tsx

'use client';

import React from 'react';

export default function SpCoinRewardsMethods() {
  return (
    <div className="prose max-w-none p-8 bg-white min-h-screen" style={{ color: '#000' }}>
      <h1 className="text-2xl font-bold mb-6">SpCoinRewardsMethods</h1>

      <h2 className="text-xl font-semibold">Module Description</h2>
      <p>
        This code defines a JavaScript module that exports a class <code>SpCoinRewardsMethods</code> along with some constants and utility functions. This module provides methods for interacting with the SpCoin smart contract for rewards calculations and issuance.
      </p>

      <h2 className="text-xl font-semibold">Properties</h2>
      <ul className="list-disc list-inside ml-4">
        <li><b>spCoinContractDeployed</b> (Object): The deployed instance of the SpCoin smart contract.</li>
        <li><b>spCoinLogger</b> (Object): An instance of the SpCoinLogger class for logging purposes.</li>
        <li><b>signer</b> (Object): The signer for the SpCoin smart contract.</li>
      </ul>

      <h2 className="text-xl font-semibold">Constructor</h2>
      <ul className="list-disc list-inside ml-4">
        <li>
          <p><b>Constructor(_spCoinContractDeployed)</b></p>
          <ul className="list-disc list-inside ml-4">
            <li><b>Description:</b> Creates an instance of SpCoinRewardsMethods and initializes properties.</li>
            <li><b>Parameters:</b>
              <ul className="list-disc list-inside ml-6">
                <li>_spCoinContractDeployed (Object): The deployed instance of the SpCoin smart contract.</li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>

      <h2 className="text-xl font-semibold">Methods</h2>
      <ul className="list-disc list-inside ml-4">
        <li>
          <p><b>setSigner(_signer)</b></p>
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
          <p><b>updateAccountStakingRewards(_accountKey)</b></p>
          <ul className="list-disc list-inside ml-4">
            <li><b>Description:</b> Updates rewards for a specified account.</li>
            <li><b>Parameters:</b>
              <ul className="list-disc list-inside ml-6">
                <li>_accountKey: The account for requested staking rewards update.</li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>

      <h2 className="text-xl font-semibold">Exporting the Module</h2>
      <p>
        The module exports an object with a single property <code>SpCoinRewardsMethods</code> which holds the class.
      </p>
    </div>
  );
}
