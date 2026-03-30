import type { ContractTransactionResponse, Signer } from "ethers";
import type { SpCoinLoggerLike, SpCoinModuleContract } from "../shared/runtimeTypes";
type BoundModuleMethod<T> = T extends (context: SpCoinDeleteModuleContext, ...args: infer TArgs) => infer TResult ? (...args: TArgs) => TResult : never;
export type SpCoinDeleteModuleMethods = {
    deleteAccountRecord: (context: SpCoinDeleteModuleContext, _accountKey: string) => Promise<ContractTransactionResponse>;
    deleteAccountRecords: (context: SpCoinDeleteModuleContext, _accountListKeys: string[]) => Promise<number>;
    unSponsorRecipient: (context: SpCoinDeleteModuleContext, _sponsorKey: {
        accountKey: string;
    }, _recipientKey: string) => Promise<unknown>;
    deleteAgentRecord: (context: SpCoinDeleteModuleContext, _accountKey: string, _recipientKey: string, _accountAgentKey: string) => Promise<void>;
};
export type SpCoinDeleteModuleMethod = (context: SpCoinDeleteModuleContext, ...args: any[]) => unknown;
export type SpCoinDeleteModuleBoundMethods = {
    [K in keyof SpCoinDeleteModuleMethods]: BoundModuleMethod<SpCoinDeleteModuleMethods[K]>;
};
export type SpCoinDeleteModuleContext = {
    spCoinContractDeployed: SpCoinModuleContract;
    spCoinLogger: SpCoinLoggerLike;
    signer?: Signer;
} & Partial<SpCoinDeleteModuleBoundMethods>;
export {};
