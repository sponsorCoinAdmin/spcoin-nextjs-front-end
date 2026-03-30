import type { ContractTransactionResponse, Signer } from "ethers";
import type { SpCoinLoggerLike, SpCoinModuleContract } from "../shared/runtimeTypes";
type BoundModuleMethod<T> = T extends (context: SpCoinAddModuleContext, ...args: infer TArgs) => infer TResult ? (...args: TArgs) => TResult : never;
export type SpCoinAddModuleMethods = {
    addRecipient: (context: SpCoinAddModuleContext, _recipientKey: string) => Promise<ContractTransactionResponse>;
    addRecipients: (context: SpCoinAddModuleContext, _accountKey: string, _recipientAccountList: string[]) => Promise<number>;
    addAgent: (context: SpCoinAddModuleContext, _recipientKey: string, _recipientRateKey: string | number, _accountAgentKey: string) => Promise<ContractTransactionResponse>;
    addAgents: (context: SpCoinAddModuleContext, _recipientKey: string, _recipientRateKey: string | number, _agentAccountList: string[]) => Promise<number>;
    addAccountRecord: (context: SpCoinAddModuleContext, _accountKey: string) => Promise<void>;
    addAccountRecords: (context: SpCoinAddModuleContext, _accountListKeys: string[]) => Promise<number>;
    addSponsorship: (context: SpCoinAddModuleContext, _sponsorSigner: Signer, _recipientKey: string, _recipientRateKey: string | number, _transactionQty: string | number) => Promise<void>;
    addAgentSponsorship: (context: SpCoinAddModuleContext, _sponsorSigner: Signer, _recipientKey: string, _recipientRateKey: string | number, _accountAgentKey: string, _agentRateKey: string | number, _transactionQty: string | number) => Promise<ContractTransactionResponse>;
    addBackDatedSponsorship: (context: SpCoinAddModuleContext, _adminSigner: Signer, _sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number, _transactionQty: string | number, _transactionBackDate: number) => Promise<void>;
    addBackDatedAgentSponsorship: (context: SpCoinAddModuleContext, _adminSigner: Signer, _sponsorKey: string, _recipientKey: string, _recipientRateKey: string | number, _accountAgentKey: string, _agentRateKey: string | number, _transactionQty: string | number, _transactionBackDate: number) => Promise<ContractTransactionResponse>;
};
export type SpCoinAddModuleMethod = (context: SpCoinAddModuleContext, ...args: any[]) => unknown;
export type SpCoinAddModuleBoundMethods = {
    [K in keyof SpCoinAddModuleMethods]: BoundModuleMethod<SpCoinAddModuleMethods[K]>;
};
export type SpCoinAddModuleContext = {
    spCoinContractDeployed: SpCoinModuleContract;
    spCoinLogger: SpCoinLoggerLike;
    signer?: Signer;
} & Partial<SpCoinAddModuleBoundMethods>;
export {};
