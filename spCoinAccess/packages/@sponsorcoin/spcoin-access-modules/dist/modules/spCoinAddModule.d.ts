declare const SpCoinLogger: any;
declare let spCoinLogger: any;
declare const BURN_ADDRESS = "0x0000000000000000000000000000000000000000";
declare class SpCoinAddModule {
    constructor(_spCoinContractDeployed: any);
    addRecipient: (_recipientKey: any) => Promise<any>;
    addRecipients: (_accountKey: any, _recipientAccountList: any) => Promise<number>;
    addAgent: (_recipientKey: any, _recipientRateKey: any, _accountAgentKey: any) => Promise<void>;
    addAgents: (_recipientKey: any, _recipientRateKey: any, _agentAccountList: any) => Promise<number>;
    addAccountRecord: (_accountKey: any) => Promise<void>;
    addAccountRecords: (_accountListKeys: any) => Promise<any>;
    addSponsorship: (_sponsorSigner: any, _recipientKey: any, _recipientRateKey: any, _transactionQty: any) => Promise<void>;
    addAgentSponsorship: (_sponsorSigner: any, _recipientKey: any, _recipientRateKey: any, _accountAgentKey: any, _agentRateKey: any, _transactionQty: any) => Promise<void>;
    addBackDatedSponsorship: (_sponsorSigner: any, _recipientKey: any, _recipientRateKey: any, _transactionQty: any, _transactionBackDate: any) => Promise<void>;
    addBackDatedAgentSponsorship: (_sponsorSigner: any, _recipientKey: any, _recipientRateKey: any, _accountAgentKey: any, _agentRateKey: any, _transactionQty: any, _transactionBackDate: any) => Promise<void>;
}
