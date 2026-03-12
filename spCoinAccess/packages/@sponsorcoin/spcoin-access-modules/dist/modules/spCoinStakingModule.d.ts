declare const bigIntToDecString: any, second: any, minute: any, hour: any, day: any, week: any, year: any, month: any, millennium: any;
declare const SpCoinLogger: any;
declare let spCoinLogger: any;
declare const SPONSOR = 0;
declare const RECIPIENT = 1;
declare const AGENT = 2;
declare const burnAddress = "0x0000000000000000000000000000000000000000";
declare class SpCoinStakingModule {
    constructor(_spCoinContractDeployed: any);
    testStakingRewards: (lastUpdateTime: any, testUpdateTime: any, interestRate: any, quantity: any) => Promise<any>;
    getStakingRewards: (lastUpdateTime: any, interestRate: any, quantity: any) => Promise<any>;
    getTimeMultiplier: (_timeRateMultiplier: any) => Promise<any>;
    getAccountTimeInSecondeSinceUpdate: (_tokenLastUpdate: any) => Promise<any>;
    getMillenniumTimeIntervalDivisor: (_timeInSeconds: any) => Promise<any>;
    depositSponsorStakingRewards: (_sponsorAccount: any, _recipientAccount: any, _recipientRate: any, _amount: any) => Promise<void>;
    depositRecipientStakingRewards: (_sponsorAccount: any, _recipientAccount: any, _recipientRate: any, _amount: any) => Promise<void>;
    depositAgentStakingRewards: (_sponsorAccount: any, _recipientAccount: any, _recipientRate: any, _agentAccount: any, _agentRate: any, _amount: any) => Promise<void>;
}
