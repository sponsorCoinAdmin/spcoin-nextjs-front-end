import type { ContractTransactionResponse } from "ethers";
export declare class SpCoinRewardsModule {
    spCoinContractDeployed: any;
    updateAccountStakingRewards: (accountKey: string) => Promise<ContractTransactionResponse>;
    constructor(_spCoinContractDeployed: any);
}
