import type { ContractTransactionResponse, Signer } from "ethers";
import type { SpCoinLoggerLike, SpCoinModuleContract } from "../shared/runtimeTypes";
type BoundModuleMethod<T> = T extends (context: SpCoinStakingModuleContext, ...args: infer TArgs) => infer TResult ? (...args: TArgs) => TResult : never;
export type SpCoinStakingModuleMethods = {
    testStakingRewards: (context: SpCoinStakingModuleContext, lastUpdateTime: unknown, testUpdateTime: unknown, interestRate: unknown, quantity: unknown) => Promise<unknown>;
    getStakingRewards: (context: SpCoinStakingModuleContext, lastUpdateTime: unknown, interestRate: unknown, quantity: unknown) => Promise<unknown>;
    getTimeMultiplier: (context: SpCoinStakingModuleContext, _timeRateMultiplier: unknown) => Promise<unknown>;
    getAccountTimeInSecondeSinceUpdate: (context: SpCoinStakingModuleContext, _tokenLastUpdate: unknown) => Promise<unknown>;
    getMillenniumTimeIntervalDivisor: (context: SpCoinStakingModuleContext, _timeInSeconds: unknown) => Promise<string>;
    depositSponsorStakingRewards: (context: SpCoinStakingModuleContext, _sponsorAccount: string, _recipientAccount: string, _recipientRate: string | number, _amount: string | number) => Promise<ContractTransactionResponse>;
    depositRecipientStakingRewards: (context: SpCoinStakingModuleContext, _sponsorAccount: string, _recipientAccount: string, _recipientRate: string | number, _amount: string | number) => Promise<ContractTransactionResponse>;
    depositAgentStakingRewards: (context: SpCoinStakingModuleContext, _sponsorAccount: string, _recipientAccount: string, _recipientRate: string | number, _agentAccount: string, _agentRate: string | number, _amount: string | number) => Promise<ContractTransactionResponse>;
};
export type SpCoinStakingModuleMethod = (context: SpCoinStakingModuleContext, ...args: any[]) => unknown;
export type SpCoinStakingModuleBoundMethods = {
    [K in keyof SpCoinStakingModuleMethods]: BoundModuleMethod<SpCoinStakingModuleMethods[K]>;
};
export type SpCoinStakingModuleContext = {
    spCoinContractDeployed: SpCoinModuleContract;
    spCoinLogger: SpCoinLoggerLike;
    signer?: Signer;
} & Partial<SpCoinStakingModuleBoundMethods>;
export {};
