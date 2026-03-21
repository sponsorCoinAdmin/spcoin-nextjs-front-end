import type { ContractTransactionResponse, Signer } from "ethers";
declare const bigIntToDecString: any, second: any, minute: any, hour: any, day: any, week: any, year: any, month: any, millennium: any;
export declare class SpCoinStakingModule {
    spCoinContractDeployed: any;
    signer?: Signer;
    testStakingRewards: (lastUpdateTime: string | number | bigint, testUpdateTime: string | number | bigint, interestRate: string | number | bigint, quantity: string | number | bigint) => Promise<bigint>;
    getStakingRewards: (lastUpdateTime: string | number | bigint, interestRate: string | number | bigint, quantity: string | number | bigint) => Promise<bigint>;
    getTimeMultiplier: (_timeRateMultiplier: string | number | bigint) => Promise<bigint>;
    getAccountTimeInSecondeSinceUpdate: (_tokenLastUpdate: string | number | bigint) => Promise<bigint>;
    getMillenniumTimeIntervalDivisor: (_timeInSeconds: string | number | bigint) => Promise<string>;
    depositSponsorStakingRewards: (_sponsorAccount: string, _recipientAccount: string, _recipientRate: string | number, _amount: string | number | bigint) => Promise<ContractTransactionResponse>;
    depositRecipientStakingRewards: (_sponsorAccount: string, _recipientAccount: string, _recipientRate: string | number, _amount: string | number | bigint) => Promise<ContractTransactionResponse>;
    depositAgentStakingRewards: (_sponsorAccount: string, _recipientAccount: string, _recipientRate: string | number, _agentAccount: string, _agentRate: string | number, _amount: string | number | bigint) => Promise<ContractTransactionResponse>;
    constructor(_spCoinContractDeployed: any);
}
export { bigIntToDecString, second, minute, hour, day, week, year, month, millennium };
