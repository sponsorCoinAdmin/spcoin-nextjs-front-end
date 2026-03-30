import type { ContractTransactionResponse } from "ethers";
import type { SpCoinSerialize } from "../../utils//serialize";
import type { SpCoinLoggerLike, SpCoinModuleContract } from "../shared/runtimeTypes";
type BoundModuleMethod<T> = T extends (context: SpCoinRewardsModuleContext, ...args: infer TArgs) => infer TResult ? (...args: TArgs) => TResult : never;
export type SpCoinRewardsModuleMethods = {
    updateAccountStakingRewards: (context: SpCoinRewardsModuleContext, accountKey: string) => Promise<ContractTransactionResponse>;
};
export type SpCoinRewardsModuleMethod = (context: SpCoinRewardsModuleContext, ...args: any[]) => unknown;
export type SpCoinRewardsModuleBoundMethods = {
    [K in keyof SpCoinRewardsModuleMethods]: BoundModuleMethod<SpCoinRewardsModuleMethods[K]>;
};
export type SpCoinRewardsModuleContext = {
    spCoinContractDeployed: SpCoinModuleContract;
    spCoinLogger: SpCoinLoggerLike;
    spCoinSerialize: SpCoinSerialize;
} & Partial<SpCoinRewardsModuleBoundMethods>;
export {};
