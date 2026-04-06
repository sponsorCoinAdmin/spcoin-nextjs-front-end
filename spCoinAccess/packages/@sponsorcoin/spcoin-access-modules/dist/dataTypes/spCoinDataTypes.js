// @ts-nocheck
export class SponsorCoinHeader {
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
    // Initialize values to maintain output display order
    constructor() {
        this.TYPE = "--ACCOUNT--";
        this.accountKey = 0;
        this.balanceOf = 0;
        this.stakedSPCoins = 0;
        this.creationTime = 0;
        this.verified = false;
        this.parentSponsorList = 0;
        this.recipientAccountList = 0;
        this.agentAccountList = 0;
        this.parentRecipientList = 0;
        this.recipientRecordList = 0;
        this.stakingRewards = 0;
        this.stakingRewardList = 0;
    }
}
export class RecipientStruct {
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
    constructor() {
        this.TYPE = "--STAKING TRANSACTION RECORD--";
        this.insertionTime;
        this.location;
        this.quantity;
    }
}
/// STAKING REWARDS SECTION ////////////////////////////////////////////////////////////////////
export class RewardsStruct {
    constructor() {
        this.TYPE = "--REWARDS STRUCTURE--";
        this.sponsorRewardsList;
        this.recipientRewardsList;
        this.agentRewardsList;
    }
}
export class RewardTypeStruct {
    constructor() {
        this.TYPE;
        this.stakingRewards;
        this.rewardAccountList;
    }
}
export class RewardAccountStruct {
    constructor() {
        this.TYPE = "--REWARD ACCOUNT--";
        this.sourceKey;
        this.stakingRewards;
        this.rateList;
    }
}
export class RewardRateStruct {
    constructor() {
        this.TYPE = "--REWARD RATE--";
        this.rate;
        this.stakingRewards;
        this.rewardTransactionList;
    }
}
export class RewardTransactionStruct {
    constructor() {
        this.TYPE = "--REWARD TRANSACTION--";
        this.updateTime;
        this.stakingRewards;
    }
}
