import type { ContractTransactionResponse, Signer } from "ethers";
export declare class SpCoinDeleteModule {
    spCoinContractDeployed: any;
    signer?: Signer;
    deleteAccountRecord: (_accountKey: string) => Promise<ContractTransactionResponse>;
    deleteAccountRecords: (_accountListKeys: string[]) => Promise<number>;
    unSponsorRecipient: (_sponsorKey: {
        accountKey: string;
    }, _recipientKey: string) => Promise<ContractTransactionResponse>;
    deleteAgentRecord: (_accountKey: string, _recipientKey: string, _accountAgentKey: string) => Promise<void>;
    constructor(_spCoinContractDeployed: any);
}
