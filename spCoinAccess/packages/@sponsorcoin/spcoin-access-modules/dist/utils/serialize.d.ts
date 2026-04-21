import { Interface } from "ethers";
export declare const accountRewardTotalsInterface: Interface;
export declare const accountCoreInterface: Interface;
export declare const accountLinksInterface: Interface;
export declare const recipientRecordCoreInterface: Interface;
export declare const recipientTransactionCoreInterface: Interface;
export declare const agentTransactionCoreInterface: Interface;
export declare function callViewFunction(contract: any, iface: any, functionName: any, args: any): Promise<any>;
export declare function readAnnualInflation(contract: any): Promise<any>;
export declare function normalizeAddress(value: any): string;
export declare function normalizeAddressList(values: any): any;
export declare function buildSerializedAccountRecordFallback(contract: any, accountKey: any): Promise<string>;
export declare function buildSerializedAccountRewardsFallback(contract: any, accountKey: any): Promise<string>;
export declare function buildSerializedRecipientRecordFallback(contract: any, sponsorKey: any, recipientKey: any): Promise<string>;
export declare function buildSerializedRecipientRateFallback(contract: any, sponsorKey: any, recipientKey: any, recipientRateKey: any): Promise<string>;
export declare function buildSerializedAgentRateFallback(contract: any, sponsorKey: any, recipientKey: any, recipientRateKey: any, agentKey: any, agentRateKey: any): Promise<string>;
export declare class SpCoinSerialize {
    constructor(_spCoinContractDeployed: any);
}
