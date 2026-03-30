import type { ContractTransactionResponse, Signer } from "ethers";
export interface SpCoinLoggerLike {
    logFunctionHeader(message: string): void;
    logDetail(message: string): void;
    logExitFunction(): void;
}
export interface SpCoinSerializeLike {
    getAccountRewardsValue(...args: any[]): Promise<unknown>;
    getAccountRecordObject(...args: any[]): Promise<unknown>;
    deserializeRateTransactionRecords(...args: any[]): unknown;
    getAgentRateRecordFields(...args: any[]): Promise<unknown>;
    getRecipientRateRecordFields(...args: any[]): Promise<unknown>;
    getRecipientRecordFields(...args: any[]): Promise<unknown>;
    getSPCoinHeaderObject(...args: any[]): Promise<unknown>;
    [key: string]: any;
}
export interface SpCoinModuleContract {
    connect(signer: Signer): SpCoinModuleContract;
    transfer(to: string, value: string): Promise<void>;
    addRecipient(recipientKey: string): Promise<ContractTransactionResponse>;
    addAgent(recipientKey: string, recipientRateKey: string | number, accountAgentKey: string): Promise<ContractTransactionResponse>;
    addAccountRecord(accountKey: string): Promise<void>;
    addSponsorship(recipientKey: string, recipientRateKey: string | number, accountAgentKey: string, agentRateKey: string | number, wholePart: string, fractionalPart: string): Promise<ContractTransactionResponse>;
    addBackDatedSponsorship(sponsorKey: string, recipientKey: string, recipientRateKey: string | number, accountAgentKey: string, agentRateKey: string | number, wholePart: string, fractionalPart: string, transactionBackDate: number): Promise<ContractTransactionResponse>;
    deleteAccountRecord(accountKey: string): Promise<ContractTransactionResponse>;
    unSponsorRecipient(recipientKey: string): Promise<unknown>;
    updateAccountStakingRewards(accountKey: string): Promise<ContractTransactionResponse>;
    testStakingRewards(lastUpdateTime: unknown, testUpdateTime: unknown, interestRate: unknown, quantity: unknown): Promise<unknown>;
    getStakingRewards(lastUpdateTime: unknown, interestRate: unknown, quantity: unknown): Promise<unknown>;
    getTimeMultiplier(timeRateMultiplier: unknown): Promise<unknown>;
    getAccountTimeInSecondeSinceUpdate(tokenLastUpdate: unknown): Promise<unknown>;
    getMillenniumTimeIntervalDivisor(timeInSeconds: unknown): Promise<unknown>;
    depositStakingRewards(rewardType: number, sponsorAccount: string, recipientAccount: string, recipientRate: string | number, agentOrRecipientAccount: string, agentRate: string | number, amount: string | number): Promise<ContractTransactionResponse>;
}
