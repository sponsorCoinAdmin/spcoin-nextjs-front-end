// @ts-nocheck
/**
 * SponsorCoin Access Modules
 * File: dist/offChain/index.js
 * Role: Off-chain processor facade that exposes orchestration helpers and shared utilities.
 */
import * as logging_1 from "../utils/logging";
import * as serialize_1 from "../utils/serialize";
import * as dateTime from "../utils/dateTime";
import * as dataTypes from "../dataTypes/spCoinDataTypes";
import * as printTreeStructures from "../utils/printTreeStructures";
import * as addRecipients_1 from "./addRecipients";
import * as addAgents_1 from "./addAgents";
import * as addOffChainRecipients_1 from "./addOffChainRecipients";
import * as addOffChainAgents_1 from "./addOffChainAgents";
import * as deleteAccountTree_1 from "./deleteAccountTree";
import * as setLowerRecipientRate_1 from "./setLowerRecipientRate";
import * as setUpperRecipientRate_1 from "./setUpperRecipientRate";
import * as setLowerAgentRate_1 from "./setLowerAgentRate";
import * as setUpperAgentRate_1 from "./setUpperAgentRate";
export function resolveContract(value) {
    if (!value)
        return undefined;
    if (value.contract)
        return value.contract;
    if (value.spCoinContractDeployed)
        return value.spCoinContractDeployed;
    return value;
}
export class SpCoinOffChainProcessor {
    constructor(onChainOrContract) {
        this.contract = resolveContract(onChainOrContract);
        this.onChain = onChainOrContract && onChainOrContract.contract ? onChainOrContract : undefined;
        this.logger = new logging_1.SpCoinLogger(this.contract);
        this.serialize = new serialize_1.SpCoinSerialize(this.contract);
        this.dateTime = dateTime;
        this.dataTypes = dataTypes;
        this.printTreeStructures = printTreeStructures;
    }
    async addRecipients(_accountKey, recipientAccountList) {
        return (0, addRecipients_1.addRecipients).call(this, _accountKey, recipientAccountList);
    }
    async addAgents(sponsorKey, recipientKey, recipientRateKey, agentAccountList) {
        return (0, addAgents_1.addAgents).call(this, sponsorKey, recipientKey, recipientRateKey, agentAccountList);
    }
    async addOffChainRecipients(accountKey, recipientAccountList) {
        return (0, addOffChainRecipients_1.addOffChainRecipients).call(this, accountKey, recipientAccountList);
    }
    async addOffChainAgents(recipientKey, recipientRateKey, agentAccountList) {
        return (0, addOffChainAgents_1.addOffChainAgents).call(this, recipientKey, recipientRateKey, agentAccountList);
    }
    async deleteAccountTree() {
        return (0, deleteAccountTree_1.deleteAccountTree).call(this);
    }
    async setLowerRecipientRate(newLowerRecipientRate) {
        return (0, setLowerRecipientRate_1.setLowerRecipientRate).call(this, newLowerRecipientRate);
    }
    async setUpperRecipientRate(newUpperRecipientRate) {
        return (0, setUpperRecipientRate_1.setUpperRecipientRate).call(this, newUpperRecipientRate);
    }
    async setLowerAgentRate(newLowerAgentRate) {
        return (0, setLowerAgentRate_1.setLowerAgentRate).call(this, newLowerAgentRate);
    }
    async setUpperAgentRate(newUpperAgentRate) {
        return (0, setUpperAgentRate_1.setUpperAgentRate).call(this, newUpperAgentRate);
    }
    methods() {
        return {
            contract: this.contract,
            onChain: this.onChain,
            addRecipients: this.addRecipients.bind(this),
            addAgents: this.addAgents.bind(this),
            addOffChainRecipients: this.addOffChainRecipients.bind(this),
            addOffChainAgents: this.addOffChainAgents.bind(this),
            deleteAccountTree: this.deleteAccountTree.bind(this),
            setLowerRecipientRate: this.setLowerRecipientRate.bind(this),
            setUpperRecipientRate: this.setUpperRecipientRate.bind(this),
            setLowerAgentRate: this.setLowerAgentRate.bind(this),
            setUpperAgentRate: this.setUpperAgentRate.bind(this),
            logger: this.logger,
            serialize: this.serialize,
            dateTime: this.dateTime,
            dataTypes: this.dataTypes,
            printTreeStructures: this.printTreeStructures,
        };
    }
}
