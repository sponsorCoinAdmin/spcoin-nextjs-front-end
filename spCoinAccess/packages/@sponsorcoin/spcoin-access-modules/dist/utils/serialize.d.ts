declare const SpCoinLogger: any;
declare const formatTimeSeconds: any;
declare const bigIntToDateTimeString: any, bigIntToDecString: any, bigIntToHexString: any, bigIntToString: any, getLocation: any;
declare const SponsorCoinHeader: any, AccountStruct: any, RecipientStruct: any, AgentStruct: any, AgentRateStruct: any, StakingTransactionStruct: any;
declare let spCoinLogger: any;
declare class SpCoinSerialize {
    constructor(_spCoinContractDeployed: any);
    setContract: (_spCoinContractDeployed: any) => void;
    deSerializedAccountRec: (_serializedAccountRec: any) => Promise<AccountStruct>;
    addAccountField: (_key: any, _value: any, accountRecord: any) => void;
    parseAddressStrRecord: (strRecord: any) => any;
    getSerializedRecipientRateList: (_sponsorKey: any, _recipientKey: any, _recipientRateKey: any) => Promise<any>;
    getSerializedRecipientRecordList: (_sponsorKey: any, _recipientKey: any) => Promise<any>;
    getSerializedAgentRateList: (_sponsorKey: any, _recipientKey: any, _recipientRateKey: any, _agentKey: any, _agentRateKey: any) => Promise<any>;
    getSerializedAccountRecord: (_accountKey: any) => Promise<AccountStruct>;
    getSerializedAccountRewards: (_accountKey: any) => Promise<AccountStruct>;
    deserializeRateTransactionRecords: (transactionStr: any) => any[];
    deserializedSPCoinHeader: () => Promise<SponsorCoinHeader>;
    addSPCoinHeaderField: (_key: any, _value: any, spCoinHeaderRecord: any) => void;
}
