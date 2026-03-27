"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpCoinOffChainProcessor = void 0;
const logging_1 = require("../utils/logging");
const serialize_1 = require("../utils/serialize");
const dateTime = require("../utils/dateTime");
const dataTypes = require("../dataTypes/spCoinDataTypes");
const printTreeStructures = require("../utils/printTreeStructures");
function resolveContract(value) {
    if (!value)
        return undefined;
    if (value.contract)
        return value.contract;
    if (value.spCoinContractDeployed)
        return value.spCoinContractDeployed;
    return value;
}
class SpCoinOffChainProcessor {
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
        var _a, _b;
        const addRecipient = (_b = (_a = this.onChain) === null || _a === void 0 ? void 0 : _a.add) === null || _b === void 0 ? void 0 : _b.addRecipient;
        if (typeof addRecipient !== "function") {
            throw new Error("addRecipient is not available on the current SpCoin onChain processor.");
        }
        let recipientCount = 0;
        for (const recipientKey of recipientAccountList) {
            await addRecipient(String(recipientKey));
            recipientCount += 1;
        }
        return recipientCount;
    }
    async addAgents(recipientKey, recipientRateKey, agentAccountList) {
        var _a, _b;
        const addAgent = (_b = (_a = this.onChain) === null || _a === void 0 ? void 0 : _a.add) === null || _b === void 0 ? void 0 : _b.addAgent;
        if (typeof addAgent !== "function") {
            throw new Error("addAgent is not available on the current SpCoin onChain processor.");
        }
        let agentCount = 0;
        for (const agentKey of agentAccountList) {
            await addAgent(String(recipientKey), recipientRateKey, String(agentKey));
            agentCount += 1;
        }
        return agentCount;
    }
    async setLowerRecipientRate(newLowerRecipientRate) {
        if (typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.getRecipientRateRange) !== "function" || typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.setRecipientRateRange) !== "function") {
            throw new Error("Recipient rate range methods are not available on the current SpCoin contract.");
        }
        const range = await this.contract.getRecipientRateRange();
        return this.contract.setRecipientRateRange(newLowerRecipientRate, range[1]);
    }
    async setUpperRecipientRate(newUpperRecipientRate) {
        if (typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.getRecipientRateRange) !== "function" || typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.setRecipientRateRange) !== "function") {
            throw new Error("Recipient rate range methods are not available on the current SpCoin contract.");
        }
        const range = await this.contract.getRecipientRateRange();
        return this.contract.setRecipientRateRange(range[0], newUpperRecipientRate);
    }
    async setLowerAgentRate(newLowerAgentRate) {
        if (typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.getAgentRateRange) !== "function" || typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.setAgentRateRange) !== "function") {
            throw new Error("Agent rate range methods are not available on the current SpCoin contract.");
        }
        const range = await this.contract.getAgentRateRange();
        return this.contract.setAgentRateRange(newLowerAgentRate, range[1]);
    }
    async setUpperAgentRate(newUpperAgentRate) {
        if (typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.getAgentRateRange) !== "function" || typeof (this.contract === null || this.contract === void 0 ? void 0 : this.contract.setAgentRateRange) !== "function") {
            throw new Error("Agent rate range methods are not available on the current SpCoin contract.");
        }
        const range = await this.contract.getAgentRateRange();
        return this.contract.setAgentRateRange(range[0], newUpperAgentRate);
    }
    methods() {
        return {
            contract: this.contract,
            onChain: this.onChain,
            addRecipients: this.addRecipients.bind(this),
            addAgents: this.addAgents.bind(this),
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
exports.SpCoinOffChainProcessor = SpCoinOffChainProcessor;
