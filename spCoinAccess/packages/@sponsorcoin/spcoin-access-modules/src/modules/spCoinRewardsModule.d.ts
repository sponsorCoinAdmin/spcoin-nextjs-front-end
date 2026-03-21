// @ts-nocheck
declare const bigIntToDateTimeString: any, bigIntToDecString: any, bigIntToHexString: any, bigIntToString: any, getLocation: any;
declare const SpCoinLogger: any;
declare const SpCoinSerialize: any;
declare let spCoinLogger: any;
declare let spCoinSerialize: any;
declare class SpCoinRewardsModule {
    constructor(_spCoinContractDeployed: any);
    updateAccountStakingRewards: (accountKey: any) => Promise<void>;
}

