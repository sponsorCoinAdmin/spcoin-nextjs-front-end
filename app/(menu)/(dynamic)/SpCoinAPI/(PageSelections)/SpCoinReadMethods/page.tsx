'use client';

import React, { useState } from 'react';

const h2Class = 'mt-4 text-[20px] font-bold cursor-pointer';

export default function SpCoinReadMethodsPage() {
    const [showRead, setShowRead] = useState(false);

    return (
        <main className="min-h-screen bg-white p-8" style={{ color: '#000' }}>
            <div className="text-center mb-10">
                <h1 className="text-[30px] font-bold">SpCoinReadMethods</h1>
            </div>

            <div style={{ marginLeft: '45px', marginRight: '45px' }}>
                <h2 className={h2Class} onClick={() => setShowRead(!showRead)}>
                    Module Description {showRead ? '▾' : '▸'}
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
                                <p><b>getAccountList()</b></p>
                                <ul className="list-disc list-inside ml-4">
                                    <li><b>Description:</b> Get a list of all account keys.</li>
                                    <li><b>Returns:</b> Promise containing the list of account keys.</li>
                                </ul>
                            </li>
                            <li>
                                <p><b>getAccountListSize()</b></p>
                                <ul className="list-disc list-inside ml-4">
                                    <li><b>Description:</b> Get the size of the account list.</li>
                                    <li><b>Returns:</b> Promise containing the size of the account list.</li>
                                </ul>
                            </li>
                            <li>
                                <p><b>getAccountRecipientList(_accountKey)</b></p>
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
                                <p><b>getAccountRecipientListSize(_accountKey)</b></p>
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
                                <p><b>getAccountRecord(_accountKey)</b></p>
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
                                <p><b>getAccountStakingRewards(_accountKey)</b></p>
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
                                <p><b>getRewardTypeRecord(_accountKey, _rewardType, _reward)</b></p>
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
                                <p><b>getAccountRewardTransactionList(_rewardAccountList)</b></p>
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
                                <p><b>getAccountRewardTransactionRecord(_rewardRecordStr)</b></p>
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
                                <p><b>getAccountRateRecordList(rateRewardList)</b></p>
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
                                <p><b>getRateTransactionList(rewardRateRowList)</b></p>
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
                                <p><b>getSPCoinHeaderRecord(getBody)</b></p>
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
                                <p><b>getAccountRecords()</b></p>
                                <ul className="list-disc list-inside ml-4">
                                    <li><b>Description:</b> Get a list of all account records.</li>
                                    <li><b>Returns:</b> Promise containing the list of account records.</li>
                                </ul>
                            </li>
                            <li>
                                <p><b>getAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getAgentRateRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</b></p>
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
                                <p><b>getAgentRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getAgentRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getAgentRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentAccountList)</b></p>
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
                                <p><b>getAgentRateTransactionList(_sponsorCoin, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</b></p>
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
                                <p><b>getAgentTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRecipientRateTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey)</b></p>
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
                                <p><b>getRecipientTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getSponsorRecipientTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRecipientRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRecipientRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRecipientRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRecipientRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRecipientRateRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _recipientRate)</b></p>
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
                                <p><b>getRecipientRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRewardRateRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getSponsorRecord(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getSponsorRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRewardTransactionList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRewardTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRewardRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRewardTypeRecordList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getRecipientRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getAgentRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
                                <p><b>getSponsorRateTypeList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey)</b></p>
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
        </main>
    );
}