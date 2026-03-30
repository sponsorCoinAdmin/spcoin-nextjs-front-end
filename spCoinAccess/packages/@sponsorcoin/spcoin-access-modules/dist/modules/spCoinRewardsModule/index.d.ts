import { SpCoinSerialize } from "../../utils//serialize";
import type { SpCoinRewardsModuleBoundMethods } from "./types";
import type { SpCoinLoggerLike, SpCoinModuleContract } from "../shared/runtimeTypes";
export declare class SpCoinRewardsModule {
    spCoinContractDeployed: SpCoinModuleContract;
    spCoinLogger: SpCoinLoggerLike;
    spCoinSerialize: SpCoinSerialize;
    updateAccountStakingRewards: SpCoinRewardsModuleBoundMethods["updateAccountStakingRewards"];
    constructor(_spCoinContractDeployed: SpCoinModuleContract);
}
export { bindRewardsMethods } from "./bindRewardsMethods";
export * from "./methods";
export * from "./types";
