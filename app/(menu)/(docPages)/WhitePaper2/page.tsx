'use client';

import React from 'react';

const h2Class = 'mt-8 text-[20px] font-bold';

export default function ContentsPage() {
  return (
    <main className="prose max-w-none p-8 bg-white min-h-screen" style={{ color: '#000' }}>
      <h1 className="text-[30px] font-bold">Contents</h1>

      <div style={{ marginLeft: '45px', marginRight: '45px' }}>
        <h2 className={h2Class}>Overview</h2>
        <p>0</p>

        <h2 className={h2Class}>SpCoinAddMethods</h2>
        <p><b>Module Description:</b> 0</p>
        <p><b>Constructor(_spCoinContractDeployed)</b> 0</p>
        <ol>
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

        <h2 className={h2Class}>SpCoinDeleteMethods</h2>
        <p><b>Module Description:</b> 0</p>
        <p><b>Constructor(_spCoinContractDeployed)</b> 0</p>
        <ol>
          <li>setSigner(_signer)</li>
          <li>deleteAccountRecord(_accountKey)</li>
          <li>deleteAccountRecords(accountListKeys)</li>
          <li>unSponsorRecipient(_sponsorKey, _recipientKey)</li>
          <li>deleteAgentRecord (_accountKey, _recipientKey, _accountAgentKey)</li>
        </ol>

        <h2 className={h2Class}>SpCoinStakingMethods</h2>
        <p><b>Module Description:</b> 0</p>
        <p><b>Constructor(_spCoinContractDeployed)</b> 0</p>
        <ol>
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

        <h2 className={h2Class}>SpCoinRewardsMethods</h2>
        <p><b>Module Description:</b> 0</p>
        <p><b>Constructor(_spCoinContractDeployed)</b> 0</p>
        <ol>
          <li>setSigner(_signer)</li>
          <li>updateAccountStakingRewards (_accountKey)</li>
        </ol>
        <p><b>Exporting the Module:</b> The module exports an object with a single property <code>SpCoinRewardsMethods</code> which holds the class. 0</p>

        <h2 className={h2Class}>SpCoinReadMethods</h2>
        <p><b>Module Description:</b> 0</p>
        <p><b>Constructor(_spCoinContractDeployed)</b> 0</p>
        <ol>
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
          <li>getAgentRateList(...)</li>
          <li>getAgentRateRecord(...)</li>
          <li>getAgentRateRecordList(...)</li>
          <li>getAgentRecord(...)</li>
          <li>getAgentRecordList(...)</li>
          <li>getAgentRateTransactionList(...)</li>
          <li>getAgentTransactionList(...)</li>
          <li>getRecipientRateTransactionList(...)</li>
          <li>getRecipientTransactionList(...)</li>
          <li>getSponsorRecipientTransactionList(...)</li>
          <li>getRecipientRateRecordList(...)</li>
          <li>getRecipientRecord(...)</li>
          <li>getRecipientRecordList(...)</li>
          <li>getRecipientRateList(...)</li>
          <li>getRecipientRateRecord(...)</li>
          <li>getRecipientRateRecordList(...)</li>
          <li>getRewardRateRecordList(...)</li>
          <li>getSponsorRecord(...)</li>
          <li>getSponsorRecordList(...)</li>
          <li>getRewardTransactionList(...)</li>
          <li>getRewardTypeList(...)</li>
          <li>getRewardRecordList(...)</li>
          <li>getRewardTypeRecordList(...)</li>
          <li>getRecipientRateTypeList(...)</li>
          <li>getAgentRateTypeList(...)</li>
          <li>getSponsorRateTypeList(...)</li>
        </ol>
      </div>
    </main>
  );
}
