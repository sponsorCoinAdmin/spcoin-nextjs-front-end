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
        this.totalUnstakedSpCoins = "ToDo";
        this.totalStakedSPCoins = "ToDo";
        this.totalStakingRewards = "ToDo";
        this.accountRecords = [];
    }
}
export class AccountStruct {
    // Initialize values to maintain output display order
    constructor() {
        this.accountKey = 0;
        this.creationTime = 0;
        this.totalSpCoins = new TotalSpCoinsStruct();
        this.recipientAccountList = [];
        this.recipientRateBranches = {};
        this.agentAccountList = [];
        this.agentRateBranches = {};
        this.recipientRecordList = [];
        this.stakingRewards = [];
        this.stakingRewardList = [];
    }
}
export class TotalSpCoinsStruct {
    constructor() {
        this.totalSpCoins = 0;
        this.balanceOf = 0;
        this.stakedBalance = 0;
        this.pendingRewards = new PendingRewardsStruct();
    }
}
export class PendingRewardsStruct {
    constructor() {
        this.pendingRewards = 0;
        this.pendingSponsorRewards = 0;
        this.pendingRecipientRewards = 0;
        this.pendingAgentRewards = 0;
    }
}
export class RecipientStruct {
    constructor() {
        this.TYPE = "--RECIPIENT_RECORD--";
        this.recipientKey;
        this.creationTime;
        this.stakedSPCoins;
        this.verified;
        this.recipientRateTransactionList;
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
