import type { SpCoinStakingModuleBoundMethods } from "./types";
import type { SpCoinLoggerLike, SpCoinModuleContract } from "../shared/runtimeTypes";
export declare class SpCoinStakingModule {
    spCoinContractDeployed: SpCoinModuleContract;
    spCoinLogger: SpCoinLoggerLike;
    signer?: import("ethers").Signer;
    testStakingRewards: SpCoinStakingModuleBoundMethods["testStakingRewards"];
    getStakingRewards: SpCoinStakingModuleBoundMethods["getStakingRewards"];
    getTimeMultiplier: SpCoinStakingModuleBoundMethods["getTimeMultiplier"];
    getAccountTimeInSecondeSinceUpdate: SpCoinStakingModuleBoundMethods["getAccountTimeInSecondeSinceUpdate"];
    getMillenniumTimeIntervalDivisor: SpCoinStakingModuleBoundMethods["getMillenniumTimeIntervalDivisor"];
    depositSponsorStakingRewards: SpCoinStakingModuleBoundMethods["depositSponsorStakingRewards"];
    depositRecipientStakingRewards: SpCoinStakingModuleBoundMethods["depositRecipientStakingRewards"];
    depositAgentStakingRewards: SpCoinStakingModuleBoundMethods["depositAgentStakingRewards"];
    constructor(_spCoinContractDeployed: SpCoinModuleContract);
}
export { bindStakingMethods } from "./bindStakingMethods";
export * from "./methods";
export * from "./shared";
export * from "./types";
