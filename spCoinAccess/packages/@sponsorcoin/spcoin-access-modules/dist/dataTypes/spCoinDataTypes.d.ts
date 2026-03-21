export type SpCoinScalar = string | number;
export type SpCoinAddressList = string[] | string | number;
export type SpCoinDisplayValue = SpCoinScalar | Record<string, unknown>;
export type SpCoinDisplayAddressList = string[] | Record<string, never> | string | number;
export declare class SponsorCoinHeader {
    TYPE: string;
    name: string;
    symbol: string;
    version: string;
    creationTime: SpCoinDisplayValue;
    location: string;
    initialTotalSupply: string;
    totalSupply: string;
    decimals: string;
    annualInflation: string;
    totalBalanceOf: string;
    totalStakedSPCoins: string;
    totalStakingRewards: string;
    accountRecords: AccountStruct[] | string;
    constructor();
}
export declare class AccountStruct {
    TYPE: string;
    accountKey: SpCoinScalar;
    balanceOf: SpCoinScalar;
    stakedSPCoins: SpCoinScalar;
    creationTime: SpCoinDisplayValue;
    location?: string;
    verified: boolean | string;
    inserted?: string;
    KYC?: string;
    decimals?: string;
    sponsorAccountList: SpCoinDisplayAddressList;
    recipientAccountList: SpCoinDisplayAddressList;
    agentAccountList: SpCoinDisplayAddressList;
    agentParentRecipientAccountList: SpCoinDisplayAddressList;
    recipientRecordList: SpCoinScalar | RecipientStruct[];
    stakingRewards: SpCoinScalar;
    stakingRewardList: SpCoinScalar | RewardsStruct;
    constructor();
}
export declare class RecipientStruct {
    TYPE: string;
    recipientKey: string;
    creationTime: SpCoinDisplayValue;
    stakedSPCoins: SpCoinScalar;
    verified: boolean | string;
    recipientRateRecordList: RecipientRateStruct[] | SpCoinScalar;
    recipientRateList: RecipientRateStruct[] | SpCoinScalar;
    constructor();
}
export declare class RecipientRateStruct {
    TYPE: string;
    recipientRate: SpCoinScalar;
    creationTime: SpCoinDisplayValue;
    lastUpdateTime: SpCoinDisplayValue;
    stakedSPCoins: SpCoinScalar;
    transactions: StakingTransactionStruct[] | Record<string, never> | SpCoinScalar;
    agentAccountList: string[] | SpCoinScalar;
    agentRecordList: AgentStruct[] | Record<string, never> | SpCoinScalar;
    constructor();
}
export declare class AgentStruct {
    TYPE: string;
    agentKey: string;
    stakedSPCoins: SpCoinScalar;
    creationTime: SpCoinDisplayValue;
    verified: boolean | string;
    agentRateList: AgentRateStruct[] | Record<string, never> | SpCoinScalar;
    constructor();
}
export declare class AgentRateStruct {
    TYPE: string;
    agentRate: SpCoinScalar;
    stakedSPCoins: SpCoinScalar;
    creationTime: SpCoinDisplayValue;
    lastUpdateTime: SpCoinDisplayValue;
    transactions: StakingTransactionStruct[] | Record<string, never> | SpCoinScalar;
    constructor();
}
export declare class StakingTransactionStruct {
    TYPE: string;
    insertionTime: SpCoinDisplayValue;
    location: string;
    quantity: SpCoinScalar;
    constructor();
}
export declare class RewardsStruct {
    TYPE: string;
    sponsorRewardsList: RewardTypeStruct;
    recipientRewardsList: RewardTypeStruct;
    agentRewardsList: RewardTypeStruct;
    constructor();
}
export declare class RewardTypeStruct {
    TYPE: string;
    stakingRewards: SpCoinScalar;
    rewardAccountList: RewardAccountStruct[] | SpCoinScalar;
    constructor();
}
export declare class RewardAccountStruct {
    TYPE: string;
    sourceKey: string;
    stakingRewards: SpCoinScalar;
    rateList: RewardRateStruct[] | SpCoinScalar;
    constructor();
}
export declare class RewardRateStruct {
    TYPE: string;
    rate: SpCoinScalar;
    stakingRewards: SpCoinScalar;
    rewardTransactionList: RewardTransactionStruct[] | SpCoinScalar;
    constructor();
}
export declare class RewardTransactionStruct {
    TYPE: string;
    updateTime: SpCoinScalar;
    stakingRewards: SpCoinScalar;
    constructor();
}
