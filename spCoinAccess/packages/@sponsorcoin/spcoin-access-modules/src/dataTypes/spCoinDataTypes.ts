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
        this.TYPE = "--ACCOUNT--";
        this.accountKey = 0;
        this.creationTime = 0;
        this.totalSpCoins = new TotalSpCoinsStruct();
        this.recipientKeys = [];
        this.recipientRateBranches = {};
        this.agentKeys = [];
        this.agentRateBranches = {};
        this.sponsorKeys = [];
        this.parentRecipientKeys = [];
    }
}
export class TotalSpCoinsStruct {
    constructor() {
        this.TYPE = "--TOTAL_SP_COINS--";
        this.totalSpCoins = 0;
        this.balanceOf = 0;
        this.stakedBalance = 0;
        this.pendingRewards = new PendingRewardsStruct();
    }
}
export class PendingRewardsStruct {
    constructor() {
        this.TYPE = "--PENDING_REWARDS--";
        this.pendingRewards = 0;
        this.pendingSponsorRewards = 0;
        this.pendingRecipientRewards = 0;
        this.pendingAgentRewards = 0;
    }
}
export class RelationshipRecordStruct {
    constructor() {
        this.TYPE = "--RELATIONSHIP_RECORD--";
        this.role = "";
    }
}
export class RecipientStruct extends RelationshipRecordStruct {
    constructor() {
        super();
        this.TYPE = "--RECIPIENT_RECORD--";
        this.role = "RECIPIENT";
        this.recipientKey;
        this.creationTime;
        this.location;
        this.stakedSPCoins;
        this.verified;
        this.recipientRateRecordList;
        this.recipientRateKeys;
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
        this.agentKeys;
        this.agentRecordList;
    }
}
export class AgentStruct extends RelationshipRecordStruct {
    constructor() {
        super();
        this.TYPE = "--AGENT_RECORD--";
        this.role = "AGENT";
        this.agentKey;
        this.stakedSPCoins;
        this.creationTime;
        this.verified;
        this.agentRateKeys;
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
export class PendingRewardsByTypeStruct {
    constructor() {
        this.TYPE = "--PENDING_REWARDS_BY_TYPE--";
        this.pendingRewardsByType = new RewardsStruct();
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
