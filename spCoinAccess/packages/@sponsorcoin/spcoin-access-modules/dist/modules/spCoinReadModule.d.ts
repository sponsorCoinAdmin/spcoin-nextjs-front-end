export declare class SpCoinReadModule {
    spCoinContractDeployed: any;
    getAccountList: () => Promise<string[]>;
    getAccountListSize: () => Promise<number>;
    getAccountRecipientList: (_accountKey: string) => Promise<string[]>;
    getAccountRecipientListSize: (_accountKey: string) => Promise<number>;
    getAccountRecord: (_accountKey: string) => Promise<AccountStruct>;
    getAccountStakingRewards: (_accountKey: string) => Promise<RewardsStruct>;
    getRewardTypeRecord: (_accountKey: string, _rewardType: number, _reward: string | number | bigint) => Promise<RewardTypeStruct>;
    getAccountRewardTransactionList: (_rewardAccountList: string[]) => RewardAccountStruct[];
    getAccountRewardTransactionRecord: (_rewardRecordStr: string) => RewardAccountStruct | undefined;
    getAccountTransactionList: (rateRewardList: string[]) => RewardRateStruct[];
    getTransactionList: (rewardRateRowList: string[]) => RewardTransactionStruct[];
    getSpCoinMetaData: () => Promise<{
        owner: string;
        version: string;
        name: string;
        symbol: string;
        decimals: number;
        totalSupply: string;
        inflationRate: number;
        recipientRateRange: [number, number];
        agentRateRange: [number, number];
    }>;
    getAgentRateList: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number, _agentKey: string) => Promise<(string | number | bigint)[]>;
    getAgentTransaction: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number, _agentKey: string, _agentRateKey: string | number) => Promise<AgentRateStruct>;
    getAgentTransactionList: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number, _agentKey: string) => Promise<AgentRateStruct[]>;
    getAgentRecord: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number, _agentKey: string) => Promise<AgentStruct>;
    getAgentRecordList: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number, _agentAccountList: string[]) => Promise<AgentStruct[]>;
    getAgentTransactionEntries: (_sponsorCoin: string, _recipientKey: string, _recipientRateKey: string | number, _agentKey: string, _agentRateKey: string | number) => Promise<StakingTransactionStruct[]>;
    getRecipientRateAgentList: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number) => Promise<string[]>;
    getRecipientTransaction: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number) => Promise<RecipientRateStruct>;
    getRecipientTransactionList: (_sponsorKey: string, _recipientKey: string) => Promise<RecipientRateStruct[]>;
    getRecipientRecord: (_sponsorKey: string, _recipientKey: string) => Promise<RecipientStruct>;
    getRecipientRecordList: (_sponsorKey: string, _recipientAccountList: string[]) => Promise<RecipientStruct[]>;
    getRecipientRateList: (_sponsorKey: string, _recipientKey: string) => Promise<(string | number | bigint)[]>;
    getRecipientTransactionList: (_sponsorCoin: string, _recipientKey: string, _recipientRateKey: string | number) => Promise<StakingTransactionStruct[]>;
    constructor(_spCoinContractDeployed: any);
}
