import type { Signer } from "ethers";
import type { SpCoinLoggerLike, SpCoinModuleContract } from "../shared/runtimeTypes";
type BoundModuleMethod<T> = T extends (context: SpCoinERC20ModuleContext, ...args: infer TArgs) => infer TResult ? (...args: TArgs) => TResult : never;
export type SpCoinERC20ModuleMethods = {
    signerTransfer: (context: SpCoinERC20ModuleContext, _signer: Signer, _to: string, _value: string | number | bigint) => Promise<void>;
    transfer: (context: SpCoinERC20ModuleContext, _to: string, _value: string | number | bigint) => Promise<void>;
};
export type SpCoinERC20ModuleMethod = (context: SpCoinERC20ModuleContext, ...args: any[]) => unknown;
export type SpCoinERC20ModuleBoundMethods = {
    [K in keyof SpCoinERC20ModuleMethods]: BoundModuleMethod<SpCoinERC20ModuleMethods[K]>;
};
export type SpCoinERC20ModuleContext = {
    spCoinContractDeployed: SpCoinModuleContract;
    spCoinLogger: SpCoinLoggerLike;
} & Partial<SpCoinERC20ModuleBoundMethods>;
export {};
