export declare class SpCoinRewardsModule {
    spCoinContractDeployed: any;
    updateAccountStakingRewards: (accountKey: string) => Promise<import("ethers").ContractTransactionResponse>;
    updateSponsorAccountRewards: (accountKey: string) => Promise<import("ethers").ContractTransactionResponse>;
    updateRecipientAccountRewards: (accountKey: string) => Promise<import("ethers").ContractTransactionResponse>;
    updateAgentAccountRewards: (accountKey: string) => Promise<import("ethers").ContractTransactionResponse>;
    constructor(_spCoinContractDeployed: any);
}
export { bindRewardsMethods } from "./bindRewardsMethods";
export * from "./methods";
export * from "./types";
