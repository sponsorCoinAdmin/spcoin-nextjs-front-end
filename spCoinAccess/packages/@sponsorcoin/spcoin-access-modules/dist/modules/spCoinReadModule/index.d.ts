import type { SpCoinLoggerLike, SpCoinModuleContract, SpCoinSerializeLike } from "../shared/runtimeTypes";
export declare class SpCoinReadModule {
    [key: string]: unknown;
    spCoinContractDeployed: SpCoinModuleContract & Record<string, any>;
    spCoinSerialize: SpCoinSerializeLike;
    spCoinLogger: SpCoinLoggerLike;
    constructor(_spCoinContractDeployed: SpCoinModuleContract & Record<string, any>);
}
export { bindReadMethods } from './bindReadMethods';
export * from './methods';
export * from './shared';
export * from './types';
