declare const bigIntToDateTimeString: any, bigIntToDecString: any, bigIntToHexString: any, bigIntToString: any, getLocation: any;
declare const SponsorCoinHeader: any, AccountStruct: any, StakingTransactionStruct: any;
export type SerializedValue = string | number | bigint;
export type AccountRewardsValue = InstanceType<typeof AccountStruct> | string;
export declare class SpCoinSerialize {
    spCoinContractDeployed: any;
    setContract: (_spCoinContractDeployed: any) => void;
    deSerializedAccountRec: (_serializedAccountRec: string) => Promise<InstanceType<typeof AccountStruct>>;
    addAccountField: (_key: string, _value: SerializedValue, accountRecord: InstanceType<typeof AccountStruct>) => void;
    parseAddressStrRecord: (strRecord: string) => string[];
    getRecipientRateRecordFields: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: SerializedValue) => Promise<string[]>;
    getRecipientRecordFields: (_sponsorKey: string, _recipientKey: string) => Promise<string[]>;
    getAgentRateRecordFields: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: SerializedValue, _agentKey: string, _agentRateKey: SerializedValue) => Promise<string[]>;
    getAccountRecordObject: (_accountKey: string) => Promise<InstanceType<typeof AccountStruct>>;
    getAccountRewardsValue: (_accountKey: string) => Promise<AccountRewardsValue>;
    getSPCoinHeaderObject: () => Promise<InstanceType<typeof SponsorCoinHeader>>;
    getSerializedRecipientRateList: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: SerializedValue) => Promise<string[]>;
    getSerializedRecipientRecordList: (_sponsorKey: string, _recipientKey: string) => Promise<string[]>;
    getSerializedAgentRateList: (_sponsorKey: string, _recipientKey: string, _recipientRateKey: SerializedValue, _agentKey: string, _agentRateKey: SerializedValue) => Promise<string[]>;
    getSerializedAccountRecord: (_accountKey: string) => Promise<InstanceType<typeof AccountStruct>>;
    getSerializedAccountRewards: (_accountKey: string) => Promise<AccountRewardsValue>;
    deserializeRateTransactionRecords: (transactionStr: string) => InstanceType<typeof StakingTransactionStruct>[];
    deserializedSPCoinHeader: () => Promise<InstanceType<typeof SponsorCoinHeader>>;
    addSPCoinHeaderField: (_key: string, _value: SerializedValue, spCoinHeaderRecord: InstanceType<typeof SponsorCoinHeader>) => void;
    constructor(_spCoinContractDeployed: any);
}
export { bigIntToDateTimeString, bigIntToDecString, bigIntToHexString, bigIntToString, getLocation };
