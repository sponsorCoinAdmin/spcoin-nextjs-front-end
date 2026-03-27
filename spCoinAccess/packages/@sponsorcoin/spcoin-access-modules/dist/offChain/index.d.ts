import type { SpCoinLogger } from "../utils/logging";
import type { SpCoinSerialize } from "../utils/serialize";
import type { SpCoinOnChainProcessor } from "../onChain";
import * as dateTime from "../utils/dateTime";
import * as dataTypes from "../dataTypes/spCoinDataTypes";
import * as printTreeStructures from "../utils/printTreeStructures";
export type SpCoinOffChainMethods = {
    contract: any;
    onChain?: SpCoinOnChainProcessor;
    addRecipients: (_accountKey: string, _recipientAccountList: string[]) => Promise<number>;
    addAgents: (_recipientKey: string, _recipientRateKey: string | number, _agentAccountList: string[]) => Promise<number>;
    setLowerRecipientRate: (newLowerRecipientRate: string | number) => Promise<any>;
    setUpperRecipientRate: (newUpperRecipientRate: string | number) => Promise<any>;
    setLowerAgentRate: (newLowerAgentRate: string | number) => Promise<any>;
    setUpperAgentRate: (newUpperAgentRate: string | number) => Promise<any>;
    logger: SpCoinLogger;
    serialize: SpCoinSerialize;
    dateTime: typeof dateTime;
    dataTypes: typeof dataTypes;
    printTreeStructures: typeof printTreeStructures;
};
export declare class SpCoinOffChainProcessor {
    contract: any;
    onChain?: SpCoinOnChainProcessor;
    logger: SpCoinLogger;
    serialize: SpCoinSerialize;
    dateTime: typeof dateTime;
    dataTypes: typeof dataTypes;
    printTreeStructures: typeof printTreeStructures;
    constructor(onChainOrContract?: any);
    addRecipients(_accountKey: string, recipientAccountList: string[]): Promise<number>;
    addAgents(recipientKey: string, recipientRateKey: string | number, agentAccountList: string[]): Promise<number>;
    setLowerRecipientRate(newLowerRecipientRate: string | number): Promise<any>;
    setUpperRecipientRate(newUpperRecipientRate: string | number): Promise<any>;
    setLowerAgentRate(newLowerAgentRate: string | number): Promise<any>;
    setUpperAgentRate(newUpperAgentRate: string | number): Promise<any>;
    methods(): SpCoinOffChainMethods;
}
