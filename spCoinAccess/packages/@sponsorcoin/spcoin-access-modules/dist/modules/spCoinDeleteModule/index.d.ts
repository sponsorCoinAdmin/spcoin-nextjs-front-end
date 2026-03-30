import type { SpCoinDeleteModuleBoundMethods } from "./types";
import type { SpCoinLoggerLike, SpCoinModuleContract } from "../shared/runtimeTypes";
export declare class SpCoinDeleteModule {
    spCoinContractDeployed: SpCoinModuleContract;
    spCoinLogger: SpCoinLoggerLike;
    signer?: import("ethers").Signer;
    deleteAccountRecord: SpCoinDeleteModuleBoundMethods["deleteAccountRecord"];
    deleteAccountRecords: SpCoinDeleteModuleBoundMethods["deleteAccountRecords"];
    unSponsorRecipient: SpCoinDeleteModuleBoundMethods["unSponsorRecipient"];
    deleteAgentRecord: SpCoinDeleteModuleBoundMethods["deleteAgentRecord"];
    constructor(_spCoinContractDeployed: SpCoinModuleContract);
}
export { bindDeleteMethods } from "./bindDeleteMethods";
export * from "./methods";
export * from "./types";
