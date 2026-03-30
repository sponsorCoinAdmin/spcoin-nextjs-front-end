import type { SpCoinERC20ModuleBoundMethods } from "./types";
import type { SpCoinLoggerLike, SpCoinModuleContract } from "../shared/runtimeTypes";
export declare class SpCoinERC20Module {
    spCoinContractDeployed: SpCoinModuleContract;
    spCoinLogger: SpCoinLoggerLike;
    signerTransfer: SpCoinERC20ModuleBoundMethods["signerTransfer"];
    transfer: SpCoinERC20ModuleBoundMethods["transfer"];
    constructor(_spCoinContractDeployed: SpCoinModuleContract);
}
export { bindERC20Methods } from "./bindERC20Methods";
export * from "./methods";
export * from "./types";
