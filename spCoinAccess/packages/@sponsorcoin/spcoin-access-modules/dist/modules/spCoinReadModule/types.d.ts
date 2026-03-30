import type { SpCoinLoggerLike, SpCoinModuleContract, SpCoinSerializeLike } from "../shared/runtimeTypes";
type BoundModuleMethod<T> = T extends (context: SpCoinReadModuleContext, ...args: infer TArgs) => infer TResult ? (...args: TArgs) => TResult : never;
export type SpCoinReadModuleMethod = (context: SpCoinReadModuleContext, ...args: any[]) => unknown;
export type SpCoinReadModuleMethods = Record<string, SpCoinReadModuleMethod>;
export type SpCoinReadModuleBoundMethods = Record<string, (...args: any[]) => unknown>;
export type SpCoinReadModuleContext = {
    spCoinContractDeployed: SpCoinModuleContract & Record<string, any>;
    spCoinSerialize: SpCoinSerializeLike;
    spCoinLogger: SpCoinLoggerLike;
    [key: string]: unknown;
};
export type SpCoinReadBoundMethod<T extends SpCoinReadModuleMethod> = BoundModuleMethod<T>;
export {};
