// File: app/(menu)/SpCoinStakingMethods.tsx

'use client';

import React from 'react';

export default function SpCoinStakingMethods() {
  return (
    <div className="prose max-w-none p-8 bg-white min-h-screen" style={{ color: '#000' }}>
      <h1 className="text-2xl font-bold mb-6">SpCoinStakingMethods</h1>

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

      <h2 className="text-xl font-semibold">Constructor</h2>
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
          <p><b>testStakingRewards(lastUpdateTime, _testUpdateTime, _interestRate, _quantity)</b></p>
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
          <p><b>getStakingRewards(lastUpdateTime, _interestRate, _quantity)</b></p>
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
          <p><b>getTimeMultiplier(_timeRateMultiplier)</b></p>
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
          <p><b>getAccountTimeInSecondeSinceUpdate(_tokenLastUpdate)</b></p>
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
          <p><b>getMillenniumTimeIntervalDivisor(_timeInSeconds)</b></p>
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
          <p><b>depositSponsorStakingRewards(_sponsorAccount, _recipientAccount, _recipientRate, _amount)</b></p>
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
          <p><b>depositRecipientStakingRewards(_sponsorAccount, _recipientAccount, _recipientRate, _amount)</b></p>
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
          <p><b>depositAgentStakingRewards(_sponsorAccount, _recipientAccount, _recipientRate, _agentAccount, _agentRate, _amount)</b></p>
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
        </li>
      </ul>
    </div>
  );
}
