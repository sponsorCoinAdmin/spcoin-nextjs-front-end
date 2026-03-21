// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/dataTypes/spCoinDataTypes.js
export type SpCoinScalar = string | number;
export type SpCoinAddressList = string[] | string | number;
export type SpCoinDisplayValue = SpCoinScalar | Record<string, unknown>;
export type SpCoinDisplayAddressList = string[] | Record<string, never> | string | number;

export class SponsorCoinHeader {
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

    // Initialize values to maintain output display order
    constructor() {
        this.TYPE = "--SPONSOR COIN HEADER--";
        this.name = "ToDo";
        this.symbol = "ToDo";
        this.version = "ToDo";
        this.creationTime = "ToDo";
        this.location = "ToDo";
        this.initialTotalSupply = "ToDo";
        this.totalSupply = "ToDo";
        this.decimals = "ToDo";
        this.annualInflation = "ToDo";
        this.totalBalanceOf = "ToDo";
        this.totalStakedSPCoins = "ToDo";
        this.totalStakingRewards = "ToDo";
        this.accountRecords = [];
    }
}
export class AccountStruct {
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

    // Initialize values to maintain output display order
    constructor() {
        this.TYPE = "--ACCOUNT--";
        this.accountKey = 0;
        this.balanceOf = 0;
        this.stakedSPCoins = 0;
        this.creationTime = 0;
        this.verified = false;
        this.sponsorAccountList = 0;
        this.recipientAccountList = 0;
        this.agentAccountList = 0;
        this.agentParentRecipientAccountList = 0;
        this.recipientRecordList = 0;
        this.stakingRewards = 0;
        this.stakingRewardList = 0;
    }
}
export class RecipientStruct {
    TYPE: string;
    recipientKey: string;
    creationTime: SpCoinDisplayValue;
    stakedSPCoins: SpCoinScalar;
    verified: boolean | string;
    recipientRateRecordList: RecipientRateStruct[] | SpCoinScalar;
    recipientRateList: RecipientRateStruct[] | SpCoinScalar;

    constructor() {
        this.TYPE = "--RECIPIENT_RECORD--";
        this.recipientKey;
        this.creationTime;
        this.stakedSPCoins;
        this.verified;
        this.recipientRateRecordList;
        this.recipientRateList;
    }
}
export class RecipientRateStruct {
    TYPE: string;
    recipientRate: SpCoinScalar;
    creationTime: SpCoinDisplayValue;
    lastUpdateTime: SpCoinDisplayValue;
    stakedSPCoins: SpCoinScalar;
    transactions: StakingTransactionStruct[] | Record<string, never> | SpCoinScalar;
    agentAccountList: string[] | SpCoinScalar;
    agentRecordList: AgentStruct[] | Record<string, never> | SpCoinScalar;

    constructor() {
        this.TYPE = "--RECIPIENT_RATE--";
        this.recipientRate;
        this.creationTime;
        this.lastUpdateTime;
        this.stakedSPCoins;
        this.transactions;
        this.agentAccountList;
        this.agentRecordList;
    }
}
export class AgentStruct {
    TYPE: string;
    agentKey: string;
    stakedSPCoins: SpCoinScalar;
    creationTime: SpCoinDisplayValue;
    verified: boolean | string;
    agentRateList: AgentRateStruct[] | Record<string, never> | SpCoinScalar;

    constructor() {
        this.TYPE = "--AGENT_RECORD--";
        this.agentKey;
        this.stakedSPCoins;
        this.creationTime;
        this.verified;
        this.agentRateList;
    }
}
export class AgentRateStruct {
    TYPE: string;
    agentRate: SpCoinScalar;
    stakedSPCoins: SpCoinScalar;
    creationTime: SpCoinDisplayValue;
    lastUpdateTime: SpCoinDisplayValue;
    transactions: StakingTransactionStruct[] | Record<string, never> | SpCoinScalar;

    constructor() {
        this.TYPE = "--AGENT_RATE--";
        this.agentRate;
        this.stakedSPCoins;
        this.creationTime;
        this.lastUpdateTime;
        this.transactions;
    }
}
export class StakingTransactionStruct {
    TYPE: string;
    insertionTime: SpCoinDisplayValue;
    location: string;
    quantity: SpCoinScalar;

    constructor() {
        this.TYPE = "--STAKING TRANSACTION RECORD--";
        this.insertionTime;
        this.location;
        this.quantity;
    }
}
/// STAKING REWARDS SECTION ////////////////////////////////////////////////////////////////////
export class RewardsStruct {
    TYPE: string;
    sponsorRewardsList: RewardTypeStruct;
    recipientRewardsList: RewardTypeStruct;
    agentRewardsList: RewardTypeStruct;

    constructor() {
        this.TYPE = "--REWARDS STRUCTURE--";
        this.sponsorRewardsList;
        this.recipientRewardsList;
        this.agentRewardsList;
    }
}
export class RewardTypeStruct {
    TYPE: string;
    stakingRewards: SpCoinScalar;
    rewardAccountList: RewardAccountStruct[] | SpCoinScalar;

    constructor() {
        this.TYPE;
        this.stakingRewards;
        this.rewardAccountList;
    }
}
export class RewardAccountStruct {
    TYPE: string;
    sourceKey: string;
    stakingRewards: SpCoinScalar;
    rateList: RewardRateStruct[] | SpCoinScalar;

    constructor() {
        this.TYPE = "--REWARD ACCOUNT--";
        this.sourceKey;
        this.stakingRewards;
        this.rateList;
    }
}
export class RewardRateStruct {
    TYPE: string;
    rate: SpCoinScalar;
    stakingRewards: SpCoinScalar;
    rewardTransactionList: RewardTransactionStruct[] | SpCoinScalar;

    constructor() {
        this.TYPE = "--REWARD RATE--";
        this.rate;
        this.stakingRewards;
        this.rewardTransactionList;
    }
}
export class RewardTransactionStruct {
    TYPE: string;
    updateTime: SpCoinScalar;
    stakingRewards: SpCoinScalar;

    constructor() {
        this.TYPE = "--REWARD TRANSACTION--";
        this.updateTime;
        this.stakingRewards;
    }
}

