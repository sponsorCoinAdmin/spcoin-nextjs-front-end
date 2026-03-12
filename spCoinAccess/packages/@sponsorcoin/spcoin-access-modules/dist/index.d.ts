declare const ethers: any;
declare const SpCoinLogger: any;
declare const SpCoinERC20Module: any;
declare const SpCoinDeleteModule: any;
declare const SpCoinAddModule: any;
declare const SpCoinReadModule: any;
declare const SpCoinRewardsModule: any;
declare const SpCoinStakingModule: any;
declare class SpCoinAccessModules {
    constructor(spCoinABI: any, spCoinAddress: any, signer: any);
    methods: () => {
        spCoinContractDeployed: any;
        spCoinAddMethods: any;
        spCoinDeleteMethods: any;
        spCoinERC20Methods: any;
        spCoinLogger: any;
        spCoinReadMethods: any;
        spCoinRewardsMethods: any;
        spCoinStakingMethods: any;
    };
}
