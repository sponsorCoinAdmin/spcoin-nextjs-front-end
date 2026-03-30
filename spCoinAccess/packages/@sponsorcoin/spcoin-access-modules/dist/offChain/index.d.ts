export declare function resolveContract(value: any): any;
export declare class SpCoinOffChainProcessor {
    constructor(onChainOrContract: any);
    addRecipients(_accountKey: any, recipientAccountList: any): Promise<any>;
    addAgents(recipientKey: any, recipientRateKey: any, agentAccountList: any): Promise<any>;
    addOffChainRecipients(accountKey: any, recipientAccountList: any): Promise<any>;
    addOffChainAgents(recipientKey: any, recipientRateKey: any, agentAccountList: any): Promise<any>;
    deleteAccountTree(): Promise<any>;
    setLowerRecipientRate(newLowerRecipientRate: any): Promise<any>;
    setUpperRecipientRate(newUpperRecipientRate: any): Promise<any>;
    setLowerAgentRate(newLowerAgentRate: any): Promise<any>;
    setUpperAgentRate(newUpperAgentRate: any): Promise<any>;
    methods(): {
        contract: any;
        onChain: any;
        addRecipients: any;
        addAgents: any;
        addOffChainRecipients: any;
        addOffChainAgents: any;
        deleteAccountTree: any;
        setLowerRecipientRate: any;
        setUpperRecipientRate: any;
        setLowerAgentRate: any;
        setUpperAgentRate: any;
        logger: any;
        serialize: any;
        dateTime: any;
        dataTypes: any;
        printTreeStructures: any;
    };
}
