// @ts-nocheck
declare const SpCoinLogger: any;
declare let spCoinLogger: any;
declare class SpCoinDeleteModule {
    constructor(_spCoinContractDeployed: any);
    deleteAccountRecord: (_accountKey: any) => Promise<void>;
    deleteAccountRecords: (_accountListKeys: any) => Promise<void>;
    unSponsorRecipient: (_sponsorKey: any, _recipientKey: any) => Promise<void>;
    deleteAgentRecord: (_accountKey: any, _recipientKey: any, _accountAgentKey: any) => Promise<void>;
}

