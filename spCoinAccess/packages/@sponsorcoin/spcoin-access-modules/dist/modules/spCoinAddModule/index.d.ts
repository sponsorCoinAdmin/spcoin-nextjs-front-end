import type { SpCoinAddModuleBoundMethods } from "./types";
import type { SpCoinLoggerLike, SpCoinModuleContract } from "../shared/runtimeTypes";
export declare class SpCoinAddModule {
    spCoinContractDeployed: SpCoinModuleContract;
    spCoinLogger: SpCoinLoggerLike;
    signer?: import("ethers").Signer;
    addRecipient: SpCoinAddModuleBoundMethods["addRecipient"];
    addRecipients: SpCoinAddModuleBoundMethods["addRecipients"];
    addAgent: SpCoinAddModuleBoundMethods["addAgent"];
    addAgents: SpCoinAddModuleBoundMethods["addAgents"];
    addAccountRecord: SpCoinAddModuleBoundMethods["addAccountRecord"];
    addAccountRecords: SpCoinAddModuleBoundMethods["addAccountRecords"];
    addSponsorship: SpCoinAddModuleBoundMethods["addSponsorship"];
    addAgentSponsorship: SpCoinAddModuleBoundMethods["addAgentSponsorship"];
    addBackDatedSponsorship: SpCoinAddModuleBoundMethods["addBackDatedSponsorship"];
    addBackDatedAgentSponsorship: SpCoinAddModuleBoundMethods["addBackDatedAgentSponsorship"];
    constructor(_spCoinContractDeployed: SpCoinModuleContract);
}
export { bindAddMethods } from "./bindAddMethods";
export * from "./methods";
export * from "./shared";
export * from "./types";
