import type { ContractTransactionResponse } from "ethers";
export declare class SpCoinRewardsModule {
    spCoinContractDeployed: any;
    updateAccountStakingRewards: (accountKey: string) => Promise<ContractTransactionResponse>;
    updateSponsorAccountRewards: (accountKey: string) => Promise<ContractTransactionResponse>;
    updateRecipientAccountRewards: (accountKey: string) => Promise<ContractTransactionResponse>;
    updateAgentAccountRewards: (accountKey: string) => Promise<ContractTransactionResponse>;
    constructor(_spCoinContractDeployed: any);
}
