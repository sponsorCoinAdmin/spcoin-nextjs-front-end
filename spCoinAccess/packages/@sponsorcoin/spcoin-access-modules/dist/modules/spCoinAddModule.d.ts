import type { ContractTransactionResponse, Signer } from "ethers";
export declare class SpCoinAddModule {
    spCoinContractDeployed: any;
    addRecipient: (_recipientKey: string) => Promise<ContractTransactionResponse>;
    addRecipients: (_accountKey: string, _recipientAccountList: string[]) => Promise<number>;
    addAgent: (_recipientKey: string, _recipientRateKey: string | number, _accountAgentKey: string) => Promise<ContractTransactionResponse>;
    addAgents: (_recipientKey: string, _recipientRateKey: string | number, _agentAccountList: string[]) => Promise<number>;
    addAccountRecord: (_accountKey: string) => Promise<ContractTransactionResponse>;
    addAccountRecords: (_accountListKeys: string[]) => Promise<number>;
    addSponsorship: (_sponsorSigner: Signer, _recipientKey: string, _recipientRateKey: string | number, _transactionQty: string | number) => Promise<ContractTransactionResponse>;
    addAgentSponsorship: (_sponsorSigner: Signer, _recipientKey: string, _recipientRateKey: string | number, _accountAgentKey: string, _agentRateKey: string | number, _transactionQty: string | number) => Promise<ContractTransactionResponse>;
    addBackDatedSponsorship: (_sponsorSigner: Signer, _recipientKey: string, _recipientRateKey: string | number, _transactionQty: string | number, _transactionBackDate: number) => Promise<ContractTransactionResponse>;
    addBackDatedAgentSponsorship: (_sponsorSigner: Signer, _recipientKey: string, _recipientRateKey: string | number, _accountAgentKey: string, _agentRateKey: string | number, _transactionQty: string | number, _transactionBackDate: number) => Promise<ContractTransactionResponse>;
    constructor(_spCoinContractDeployed: any);
}
